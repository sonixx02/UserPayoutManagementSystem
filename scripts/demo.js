const { openDb } = require('../src/db/db');
const { buildContainer } = require('../src/container');
const { formatPaise } = require('../src/money');


const db = openDb(':memory:');
const c = buildContainer(db);

console.log('=== setup ===');
c.userRepo.create('john_doe');
c.brandRepo.create('brand_1', 1000);
const sales = [1, 2, 3].map(() => c.saleRepo.create('john_doe', 'brand_1', 4000));
console.log('created user john_doe and 3 pending sales of rs 40 each');

console.log('\n=== advance payout ===');
const adv = c.advanceService.runForUser('john_doe');
console.log(`started advance on ${adv.advancedCount} sales total ${formatPaise(adv.advancedPaise)}`);
const adv2 = c.advanceService.runForUser('john_doe');
console.log(`ran the job again to prove it is idempotent second run started ${formatPaise(adv2.advancedPaise)}`);

console.log('\n=== confirm advance transfers ===');
// the payment provider confirms each advance transfer succeeded
for (const p of c.payoutRepo.listByUser('john_doe')) {
  if (p.type === 'ADVANCE') c.payoutService.updateStatus(p.id, 'success');
}
console.log('all advance payouts marked success');

console.log('\n=== reconciliation ===');
console.log('reject sale 1 =>', c.reconciliationService.reconcile(sales[0].id, 'rejected'));
console.log('approve sale 2 =>', c.reconciliationService.reconcile(sales[1].id, 'approved'));
console.log('approve sale 3 =>', c.reconciliationService.reconcile(sales[2].id, 'approved'));

const balance = c.transactionRepo.balance('john_doe');
console.log('\n=== final payout ===');
console.log(`balance is ${formatPaise(balance)}`);
console.log(balance === 6800 ? 'PASS matches the expected rs 68' : 'FAIL');

console.log('\n=== withdrawal and failed payout recovery ===');
const w = c.withdrawalService.requestWithdrawal('john_doe', balance);
console.log(`withdraw full balance ok=${w.ok}`);
const blocked = c.withdrawalService.requestWithdrawal('john_doe', 100);
console.log(`try again within 24h => ${blocked.reason}`);
const failed = c.payoutService.updateStatus(w.payoutId, 'failed');
console.log(`payout failed reversed=${failed.reversed}`);
console.log(`balance after recovery is ${formatPaise(c.transactionRepo.balance('john_doe'))}`);
