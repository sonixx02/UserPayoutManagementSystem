const crypto = require('crypto');

// data access for the sales table
// has the guarded status updates that keep things safe under races

class SaleRepository {
  constructor(db) {
    this.db = db;
  }

  // create a new pending sale and return the created row
  create(userId, brand, earningPaise) {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO sales (id, user_id, brand, earning_paise)
         VALUES (@id, @userId, @brand, @earningPaise)`
      )
      .run({ id, userId, brand, earningPaise });
    return this.findById(id);
  }

  // find a sale by id and return the row or undefined
  findById(id) {
    return this.db.prepare('SELECT * FROM sales WHERE id = @id').get({ id });
  }

  // all pending sales of a user that were not advanced yet used by the advance job
  findPendingWithoutAdvance(userId) {
    return this.db
      .prepare(
        `SELECT * FROM sales
         WHERE user_id = @userId AND status = 'pending' AND advance_status = 'none'`
      )
      .all({ userId });
  }

  // step one of the advance claim the sale by moving it from none to initiated
  // guarded so only one worker can claim and only while it is still pending
  // returns rows changed and 0 means already claimed or reconciled
  claimAdvance(saleId, advancePaise, rateBps) {
    const info = this.db
      .prepare(
        `UPDATE sales
         SET advance_paise = @advancePaise, advance_rate_bps = @rateBps, advance_status = 'initiated'
         WHERE id = @saleId AND status = 'pending' AND advance_status = 'none'`
      )
      .run({ advancePaise, rateBps, saleId });
    return info.changes;
  }

  // step two of the advance the transfer worked so move it from initiated to paid
  // returns rows changed
  markAdvancePaid(saleId) {
    const info = this.db
      .prepare(
        `UPDATE sales SET advance_status = 'paid'
         WHERE id = @saleId AND advance_status = 'initiated'`
      )
      .run({ saleId });
    return info.changes;
  }

  // the advance transfer failed so undo the claim back to none to allow a retry
  // returns rows changed
  resetAdvance(saleId) {
    const info = this.db
      .prepare(
        `UPDATE sales SET advance_status = 'none', advance_paise = 0, advance_rate_bps = NULL
         WHERE id = @saleId AND advance_status = 'initiated'`
      )
      .run({ saleId });
    return info.changes;
  }

  // move a sale from pending to approved or rejected
  // guarded so it only applies while still pending and cannot run twice
  // returns rows changed and 0 means already reconciled
  reconcile(saleId, status) {
    const info = this.db
      .prepare(
        `UPDATE sales
         SET status = @status, reconciled_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
         WHERE id = @saleId AND status = 'pending'`
      )
      .run({ status, saleId });
    return info.changes;
  }

  // list all sales of a user newest first
  listByUser(userId) {
    return this.db
      .prepare('SELECT * FROM sales WHERE user_id = @userId ORDER BY created_at DESC, rowid DESC')
      .all({ userId });
  }
}

module.exports = SaleRepository;
