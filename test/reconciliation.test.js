const { test } = require('node:test');
const assert = require('node:assert');
const { setup, confirmAdvances } = require('./helpers');

test('final payout matches the assignment example of rs 68', () => {
  const c = setup();
  const s = [0, 1, 2].map(() => c.saleRepo.create('john_doe', 'brand_1', 4000));
  c.advanceService.runForUser('john_doe');
  confirmAdvances(c, 'john_doe');

  c.reconciliationService.reconcile(s[0].id, 'rejected');
  c.reconciliationService.reconcile(s[1].id, 'approved');
  c.reconciliationService.reconcile(s[2].id, 'approved');

  assert.equal(c.transactionRepo.balance('john_doe'), 6800);
});

test('reconciling twice does not double count', () => {
  const c = setup();
  const s = c.saleRepo.create('john_doe', 'brand_1', 4000);
  c.advanceService.runForUser('john_doe');
  confirmAdvances(c, 'john_doe');

  const first = c.reconciliationService.reconcile(s.id, 'approved');
  assert.equal(first.reconciled, true);

  const second = c.reconciliationService.reconcile(s.id, 'rejected');
  assert.equal(second.reconciled, false);
  assert.equal(c.transactionRepo.balance('john_doe'), 3600);
});

test('invalid status is rejected', () => {
  const c = setup();
  const s = c.saleRepo.create('john_doe', 'brand_1', 4000);
  assert.throws(() => c.reconciliationService.reconcile(s.id, 'maybe'), /invalid status/);
});

test('balance goes negative when clawbacks are more than credits', () => {
  const c = setup();
  const s = [0, 1].map(() => c.saleRepo.create('john_doe', 'brand_1', 4000));
  c.advanceService.runForUser('john_doe');
  confirmAdvances(c, 'john_doe');

  // both rejected so we claw back both advances of 400
  c.reconciliationService.reconcile(s[0].id, 'rejected');
  c.reconciliationService.reconcile(s[1].id, 'rejected');
  assert.equal(c.transactionRepo.balance('john_doe'), -800);
});
