const { test } = require('node:test');
const assert = require('node:assert');
const { setup } = require('./helpers');

test('advance is 10 percent of each pending sale', () => {
  const c = setup();
  for (let i = 0; i < 3; i++) c.saleRepo.create('john_doe', 'brand_1', 4000);

  const result = c.advanceService.runForUser('john_doe');
  assert.equal(result.advancedCount, 3);
  assert.equal(result.advancedPaise, 1200);
});

test('advance is created only once per sale', () => {
  const c = setup();
  for (let i = 0; i < 3; i++) c.saleRepo.create('john_doe', 'brand_1', 4000);

  c.advanceService.runForUser('john_doe');
  const second = c.advanceService.runForUser('john_doe');
  assert.equal(second.advancedPaise, 0);

  const advances = c.payoutRepo.listByUser('john_doe').filter((p) => p.type === 'ADVANCE');
  assert.equal(advances.length, 3);
});

test('advance uses the rate of the brand', () => {
  const c = setup();
  c.brandRepo.create('brand_2', 500); // 5 percent
  c.saleRepo.create('john_doe', 'brand_2', 4000);

  const result = c.advanceService.runForUser('john_doe');
  assert.equal(result.advancedPaise, 200); // 5 percent of 4000
});
