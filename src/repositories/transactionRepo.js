const crypto = require('crypto');

// data access for the transactions table which is the ledger
// balance is the sum of a users entries we never store a balance number
// the sign of the amount is decided by the service credit is positive debit is negative

class TransactionRepository {
  constructor(db) {
    this.db = db;
  }

  // add a ledger entry and return the created row
  add({ userId, type, amountPaise, saleId = null, payoutId = null }) {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO transactions (id, user_id, type, amount_paise, sale_id, payout_id)
         VALUES (@id, @userId, @type, @amountPaise, @saleId, @payoutId)`
      )
      .run({ id, userId, type, amountPaise, saleId, payoutId });
    return this.findById(id);
  }

  // credit a failed payout back to the balance
  // only one reversal per payout so it is idempotent
  // returns the created row or null if a reversal already exists
  addReversal(userId, payoutId, amountPaise) {
    try {
      return this.add({ userId, type: 'REVERSAL', amountPaise, payoutId });
    } catch (e) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return null;
      }
      throw e;
    }
  }

  // the withdrawable balance is the sum of all the users ledger entries in paise
  balance(userId) {
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(amount_paise), 0) AS balance
         FROM transactions WHERE user_id = @userId`
      )
      .get({ userId });
    return row.balance;
  }

  // find a transaction by id and return the row or undefined
  findById(id) {
    return this.db.prepare('SELECT * FROM transactions WHERE id = @id').get({ id });
  }

  // list all ledger entries of a user newest first
  listByUser(userId) {
    return this.db
      .prepare('SELECT * FROM transactions WHERE user_id = @userId ORDER BY created_at DESC, rowid DESC')
      .all({ userId });
  }
}

module.exports = TransactionRepository;
