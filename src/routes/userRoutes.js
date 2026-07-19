const express = require('express');
const { rupeesToPaise } = require('../money');

// routes for users
module.exports = function userRoutes(c) {
  const router = express.Router();

  // create a user
  router.post('/users', (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    if (c.userRepo.exists(id)) {
      return res.status(409).json({ error: 'user already exists' });
    }
    const user = c.userRepo.create(id);
    res.status(201).json(user);
  });

  // get user balance
  router.get('/users/:id/balance', (req, res) => {
    const paise = c.transactionRepo.balance(req.params.id);
    res.json({ userId: req.params.id, balancePaise: paise, balanceRupees: paise / 100 });
  });

  // list the ledger of a user
  router.get('/users/:id/transactions', (req, res) => {
    res.json(c.transactionRepo.listByUser(req.params.id));
  });

  // list payouts of a user
  router.get('/users/:id/payouts', (req, res) => {
    res.json(c.payoutRepo.listByUser(req.params.id));
  });

  // list sales of a user
  router.get('/users/:id/sales', (req, res) => {
    res.json(c.saleRepo.listByUser(req.params.id));
  });

  // request a withdrawal amount is in rupees
  router.post('/users/:id/withdrawals', (req, res) => {
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number in rupees' });
    }
    const result = c.withdrawalService.requestWithdrawal(req.params.id, rupeesToPaise(amount));
    res.status(result.ok ? 201 : 409).json(result);
  });

  return router;
};
