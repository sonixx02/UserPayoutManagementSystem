const { calcAdvancePaise } = require('../money');


// pay an advance on each pending sale  once
//  advance is two phase - first claim the sale n then create the payout
// the payout is confirmed later by  payoutService

class AdvanceService {
  constructor(db, { saleRepo, payoutRepo, brandRepo }) {
    this.db = db;
    this.saleRepo = saleRepo;
    this.payoutRepo = payoutRepo;
    this.brandRepo = brandRepo;
  }

  // runs the advance for all eligible pending sales of a user
  // safe to run again because already advanced sales are skipped
  runForUser(userId) {
    const sales = this.saleRepo.findPendingWithoutAdvance(userId);

    let advancedCount = 0;
    let advancedPaise = 0;

    for (const sale of sales) {
      const amount = this._advanceOneSale(userId, sale);
      if (amount > 0) {
        advancedCount += 1;
        advancedPaise += amount;
      }
    }

    return {
      userId,
      salesChecked: sales.length,
      advancedCount,
      skipped: sales.length - advancedCount,
      advancedPaise,
    };
  }

  // advances one sale inside a transaction
  // returns the amount advanced or 0 if skipped
  _advanceOneSale(userId, sale) {
    const brand = this.brandRepo.findByName(sale.brand);
    if (!brand) {
      throw new Error(`unknown brand: ${sale.brand}`);
    }

    const rateBps = brand.advance_rate_bps;
    const amountPaise = calcAdvancePaise(sale.earning_paise, rateBps);

    // zero earning - so settle it right away
    if (amountPaise <= 0) {
      const settleZero = this.db.transaction(() => {
        if (this.saleRepo.claimAdvance(sale.id, 0, rateBps) === 0) return;
        this.saleRepo.markAdvancePaid(sale.id);
      });
      settleZero();
      return 0;
    }

    const advanceOnce = this.db.transaction(() => {
      // claim - the sale none to initiated
      // 0 means someone already claimed it or it got reconciled so skip
      const claimed = this.saleRepo.claimAdvance(sale.id, amountPaise, rateBps);
      if (claimed === 0) {
        return 0;
      }

      // create the advance payout - initiated
      this.payoutRepo.createAdvance(userId, sale.id, amountPaise);

      return amountPaise;
    });

    return advanceOnce();
  }
}

module.exports = AdvanceService;
