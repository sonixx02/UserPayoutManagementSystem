// reconciles a pending sale to approved or rejected and writes the ledger entry
// rejected claws back the advance that was actually paid
// only a confirmed advance is netted
// if the advance is still processing we block the reconcile until it settles

class ReconciliationService {
  constructor(db, { saleRepo, transactionRepo }) {
    this.db = db;
    this.saleRepo = saleRepo;
    this.transactionRepo = transactionRepo;
  }

  // reconciles a sale
  reconcile(saleId, status) {
    if (status !== 'approved' && status !== 'rejected') {
      const e = new Error(`invalid status: ${status}`);
      e.status = 400;
      throw e;
    }

    const existing = this.saleRepo.findById(saleId);
    if (!existing) {
      const e = new Error(`sale not found: ${saleId}`);
      e.status = 404;
      throw e;
    }

    const doReconcile = this.db.transaction(() => {
      // update only if the sale is still pending 
      const changed = this.saleRepo.reconcile(saleId, status);
      if (changed === 0) {
        return { reconciled: false, status: existing.status };
      }

      const sale = this.saleRepo.findById(saleId);

      // an advance still in flight must settle before we finalise the sale
      if (sale.advance_status === 'initiated') {
        const e = new Error('cannot reconcile while the advance is still processing');
        e.status = 409;
        throw e; // rolls back the reconcile above
      }

      // only a confirmed advance is netted
      const advance = sale.advance_status === 'paid' ? sale.advance_paise : 0;

      let type;
      let amountPaise;
      if (status === 'approved') {
        // credit remaining amount
        type = 'EARNING_CREDIT';
        amountPaise = sale.earning_paise - advance;
      } else {
        // debit advance amount
        type = 'CLAWBACK';
        amountPaise = -advance;
      }

      // skip a zero entry 
      if (amountPaise !== 0) {
        this.transactionRepo.add({ userId: sale.user_id, type, amountPaise, saleId });
      }

      return { reconciled: true, status, type, amountPaise };
    });

    return doReconcile();
  }
}

module.exports = ReconciliationService;
