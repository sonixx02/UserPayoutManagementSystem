const crypto = require('crypto');

// data access for the payouts table
// a payout is money sent to the user
// an advance is automatic and a withdrawal is asked for by the user

class PayoutRepository {
  constructor(db) {
    this.db = db;
  }

  // create an advance payout for a sale
  // returns the created row or null if this sale was already advanced
  // the unique index blocks a second advance so this is our idempotency
  createAdvance(userId, saleId, amountPaise) {
    const id = crypto.randomUUID();
    try {
      this.db
        .prepare(
          `INSERT INTO payouts (id, user_id, sale_id, type, amount_paise)
           VALUES (@id, @userId, @saleId, 'ADVANCE', @amountPaise)`
        )
        .run({ id, userId, saleId, amountPaise });
      return this.findById(id);
    } catch (e) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return null; // already advanced nothing to do
      }
      throw e; // anything else is a real error
    }
  }

  // create a withdrawal payout it starts as initiated and returns the row
  createWithdrawal(userId, amountPaise) {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO payouts (id, user_id, type, amount_paise)
         VALUES (@id, @userId, 'WITHDRAWAL', @amountPaise)`
      )
      .run({ id, userId, amountPaise });
    return this.findById(id);
  }

  // find a payout by id and return the row or undefined
  findById(id) {
    return this.db.prepare('SELECT * FROM payouts WHERE id = @id').get({ id });
  }

  // update a payout status
  // guarded so it only moves from a non final state
  // this way a duplicate or late webhook cannot change a payout that is already done
  // returns rows changed
  updateStatus(payoutId, status) {
    const info = this.db
      .prepare(
        `UPDATE payouts
         SET status = @status, updated_at = datetime('now')
         WHERE id = @payoutId AND status IN ('initiated', 'processing')`
      )
      .run({ status, payoutId });
    return info.changes;
  }

  // most recent withdrawal that is not failed and is newer than the given hours
  // used for the one withdrawal per 24 hours rule
  // returns the row or undefined and the caller decides the number of hours
  findActiveWithdrawalWithinHours(userId, hours) {
    return this.db
      .prepare(
        `SELECT * FROM payouts
         WHERE user_id = @userId AND type = 'WITHDRAWAL'
           AND status IN ('initiated', 'processing', 'success')
           AND created_at > strftime('%Y-%m-%d %H:%M:%f', 'now', @cutoff)
         ORDER BY created_at DESC, rowid DESC
         LIMIT 1`
      )
      .get({ userId, cutoff: `-${hours} hours` });
  }

  // list all payouts of a user newest first
  listByUser(userId) {
    return this.db
      .prepare('SELECT * FROM payouts WHERE user_id = @userId ORDER BY created_at DESC, rowid DESC')
      .all({ userId });
  }
}

module.exports = PayoutRepository;
