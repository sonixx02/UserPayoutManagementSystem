const { test } = require('node:test');
const assert = require('node:assert');
const { setup, confirmAdvances } = require('./helpers');

test('cannot reconcile while the advance is still processing', () => {
  const c = setup();
  const s = c.saleRepo.create('john_doe', 'brand_1', 4000);
  c.advanceService.runForUser('john_doe'); 

  assert.throws(() => c.reconciliationService.reconcile(s.id, 'approved'), /still processing/);
  assert.equal(c.saleRepo.findById(s.id).status, 'pending');
});

test('confirmed advance is netted', () => {
  const c = setup();
  const s = c.saleRepo.create('john_doe', 'brand_1', 4000);
  c.advanceService.runForUser('john_doe');
  confirmAdvances(c, 'john_doe');

  c.reconciliationService.reconcile(s.id, 'approved');
  assert.equal(c.transactionRepo.balance('john_doe'), 3600); // 4000 minus 400
});

test('failed advance is reset and not netted', () => {
  const c = setup();
  const s = c.saleRepo.create('john_doe', 'brand_1', 4000);
  c.advanceService.runForUser('john_doe');

  const adv = c.payoutRepo.listByUser('john_doe').find((p) => p.type === 'ADVANCE');
  c.payoutService.updateStatus(adv.id, 'failed');

  const sale = c.saleRepo.findById(s.id);
  assert.equal(sale.advance_status, 'none');
  assert.equal(sale.advance_paise, 0);

  
  c.reconciliationService.reconcile(s.id, 'approved');
  assert.equal(c.transactionRepo.balance('john_doe'), 4000);
});

test('a failed advance can be retried', () => {
  const c = setup();
  c.saleRepo.create('john_doe', 'brand_1', 4000);
  c.advanceService.runForUser('john_doe');

  const adv = c.payoutRepo.listByUser('john_doe').find((p) => p.type === 'ADVANCE');
  c.payoutService.updateStatus(adv.id, 'failed');

  const rerun = c.advanceService.runForUser('john_doe');
  assert.equal(rerun.advancedCount, 1);
});

test('zero earning sale gets no advance and credits the full earning', () => {
  const c = setup();
  const s = c.saleRepo.create('john_doe', 'brand_1', 0);
  c.advanceService.runForUser('john_doe');

  // nothing to transfer so no advance payout is created
  const advances = c.payoutRepo.listByUser('john_doe').filter((p) => p.type === 'ADVANCE');
  assert.equal(advances.length, 0);

  c.reconciliationService.reconcile(s.id, 'approved');
  assert.equal(c.transactionRepo.balance('john_doe'), 0);
});
