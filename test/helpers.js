const { openDb } = require('../src/db/db');
const { buildContainer } = require('../src/container');


function setup() {
  const db = openDb(':memory:');
  const c = buildContainer(db);
  c.userRepo.create('john_doe');
  c.brandRepo.create('brand_1', 1000);
  return c;
}

// marks all initiated advance payouts of a user as success

function confirmAdvances(c, userId) {
  for (const p of c.payoutRepo.listByUser(userId)) {
    if (p.type === 'ADVANCE' && p.status === 'initiated') {
      c.payoutService.updateStatus(p.id, 'success');
    }
  }
}

module.exports = { setup, confirmAdvances };
