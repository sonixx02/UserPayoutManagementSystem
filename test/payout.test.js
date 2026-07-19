const { test } = require('node:test');
const assert = require('node:assert');
const { setup, confirmAdvances } = require('./helpers');


function fundUser(c) {
  const s = c.saleRepo.create('john_doe', 'brand_1', 4000);
  c.advanceService.runForUser('john_doe');
  confirmAdvances(c, 'john_doe');
  c.reconciliationService.reconcile(s.id, 'approved');
}

test('failed withdrawal is credited back and can be retried', () => {
  const c = setup();
  fundUser(c);

  const w = c.withdrawalService.requestWithdrawal('john_doe', 3600);
  assert.equal(c.transactionRepo.balance('john_doe'), 0);

  const failed = c.payoutService.updateStatus(w.payoutId, 'failed');
  assert.equal(failed.reversed, true);
  assert.equal(c.transactionRepo.balance('john_doe'), 3600);

  const retry = c.withdrawalService.requestWithdrawal('john_doe', 3600);
  assert.equal(retry.ok, true);
});

test('duplicate failure webhook does not credit twice', () => {
  const c = setup();
  fundUser(c);
  const w = c.withdrawalService.requestWithdrawal('john_doe', 3600);

  c.payoutService.updateStatus(w.payoutId, 'failed');
  const dup = c.payoutService.updateStatus(w.payoutId, 'failed');
  assert.equal(dup.updated, false);
  assert.equal(c.transactionRepo.balance('john_doe'), 3600);
});
