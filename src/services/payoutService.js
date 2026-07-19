// updates a payout status 
//  failed withdrawal credits the money back so the user can withdraw again
//  advance that succeeds is confirmed as paid on the sale
//  advance that fails resets the sale so it can be advanced again

const VALID_STATUSES = [
  'initiated',
  'processing',
  'success',
  'failed',
  'cancelled',
  'rejected',
];
const FAILURE_STATUSES = ['failed', 'cancelled', 'rejected'];

class PayoutService {
  constructor(db, { payoutRepo, transactionRepo, saleRepo }) {
    this.db = db;
    this.payoutRepo = payoutRepo;
    this.transactionRepo = transactionRepo;
    this.saleRepo = saleRepo;
  }

  // update a payout status
  updateStatus(payoutId, status) {
    if (!VALID_STATUSES.includes(status)) {
      const e = new Error(`invalid status: ${status}`);
      e.status = 400;
      throw e;
    }

    const payout = this.payoutRepo.findById(payoutId);
    if (!payout) {
      const e = new Error(`payout not found: ${payoutId}`);
      e.status = 404;
      throw e;
    }

    const runInTx = this.db.transaction(() => {
      
      // 0 - final (ignore a late or duplicate webhook)
      const changed = this.payoutRepo.updateStatus(payoutId, status);
      if (changed === 0) {
        return { updated: false, reason: 'payout already in a final state' };
      }

      const failed = FAILURE_STATUSES.includes(status);
      let reversed = false;

      if (payout.type === 'WITHDRAWAL' && failed) {
        // credit the money back one reversal per payout 
        const entry = this.transactionRepo.addReversal(
          payout.user_id,
          payoutId,
          payout.amount_paise
        );
        reversed = entry !== null;
      } else if (payout.type === 'ADVANCE' && status === 'success') {
        //  confirm it 
        this.saleRepo.markAdvancePaid(payout.sale_id);
      } else if (payout.type === 'ADVANCE' && failed) {
        // if failed reset
        this.saleRepo.resetAdvance(payout.sale_id);
      }

      return { updated: true, status, reversed };
    });

    return runInTx();
  }
}

module.exports = PayoutService;
