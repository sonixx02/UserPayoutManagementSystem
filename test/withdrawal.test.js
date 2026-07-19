const { test } = require('node:test');
const assert = require('node:assert');
const { setup, confirmAdvances } = require('./helpers');

// gives the user a balance of 3600 paise
function fundUser(c) {
  const s = c.saleRepo.create('john_doe', 'brand_1', 4000);
  c.advanceService.runForUser('john_doe');
  confirmAdvances(c, 'john_doe');
  c.reconciliationService.reconcile(s.id, 'approved');
}

test('user can withdraw within balance', () => {
  const c = setup();
  fundUser(c);
  const r = c.withdrawalService.requestWithdrawal('john_doe', 3600);
  assert.equal(r.ok, true);
  assert.equal(c.transactionRepo.balance('john_doe'), 0);
});

test('cannot withdraw more than balance', () => {
  const c = setup();
  fundUser(c);
  const r = c.withdrawalService.requestWithdrawal('john_doe', 5000);
  assert.equal(r.ok, false);
});

test('cannot withdraw when there is no balance', () => {
  const c = setup();
  const r = c.withdrawalService.requestWithdrawal('john_doe', 100);
  assert.equal(r.ok, false);
});

test('only one withdrawal is allowed per 24 hours', () => {
  const c = setup();
  fundUser(c);
  assert.equal(c.withdrawalService.requestWithdrawal('john_doe', 1000).ok, true);
  const second = c.withdrawalService.requestWithdrawal('john_doe', 1000);
  assert.equal(second.ok, false);
});
