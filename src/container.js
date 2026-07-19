const UserRepo = require('./repositories/userRepo');
const BrandRepo = require('./repositories/brandRepo');
const SaleRepo = require('./repositories/saleRepo');
const PayoutRepo = require('./repositories/payoutRepo');
const TransactionRepo = require('./repositories/transactionRepo');
const AdvanceService = require('./services/advanceService');
const ReconciliationService = require('./services/reconciliationService');
const WithdrawalService = require('./services/withdrawalService');
const PayoutService = require('./services/payoutService');


function buildContainer(db) {
  const userRepo = new UserRepo(db);
  const brandRepo = new BrandRepo(db);
  const saleRepo = new SaleRepo(db);
  const payoutRepo = new PayoutRepo(db);
  const transactionRepo = new TransactionRepo(db);

  const advanceService = new AdvanceService(db, { saleRepo, payoutRepo, brandRepo });
  const reconciliationService = new ReconciliationService(db, { saleRepo, transactionRepo });
  const withdrawalService = new WithdrawalService(db, { payoutRepo, transactionRepo });
  const payoutService = new PayoutService(db, { payoutRepo, transactionRepo, saleRepo });

  return {
    userRepo,
    brandRepo,
    saleRepo,
    payoutRepo,
    transactionRepo,
    advanceService,
    reconciliationService,
    withdrawalService,
    payoutService,
  };
}

module.exports = { buildContainer };
