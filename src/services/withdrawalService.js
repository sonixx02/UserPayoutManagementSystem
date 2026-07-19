// handles user withdrawals

const WITHDRAWAL_WINDOW_HOURS = 24;

class WithdrawalService {
  constructor(db, { payoutRepo, transactionRepo }) {
    this.db = db;
    this.payoutRepo = payoutRepo;
    this.transactionRepo = transactionRepo;
  }

  // requests a withdrawal
  requestWithdrawal(userId, amountPaise) {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      throw new Error('amount must be a positive integer (paise)');
    }

    const runInTx = this.db.transaction(() => {
      // check if user already withdrew in the last 24 hours
      const recent = this.payoutRepo.findActiveWithdrawalWithinHours(
        userId,
        WITHDRAWAL_WINDOW_HOURS
      );

      if (recent) {
        return {
          ok: false,
          reason: 'only one withdrawal allowed per 24 hours',
          lastWithdrawalAt: recent.created_at,
        };
      }

      // check available balance
      const balance = this.transactionRepo.balance(userId);

      if (amountPaise > balance) {
        return {
          ok: false,
          reason: 'amount exceeds balance',
          balancePaise: balance,
        };
      }

      // create withdrawal
      const payout = this.payoutRepo.createWithdrawal(userId, amountPaise);

      // update balance
      this.transactionRepo.add({
        userId,
        type: 'WITHDRAWAL_DEBIT',
        amountPaise: -amountPaise,
        payoutId: payout.id,
      });

      return {
        ok: true,
        payoutId: payout.id,
        amountPaise,
        balanceAfterPaise: balance - amountPaise,
      };
    });

  
    return runInTx.immediate();
  }
}

module.exports = WithdrawalService;
