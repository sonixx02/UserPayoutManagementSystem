const express = require('express');
const { rupeesToPaise } = require('../money');

// routes for sales
module.exports = function saleRoutes(c) {
  const router = express.Router();

  // create a pending sale earning 
  router.post('/sales', (req, res) => {
    const { userId, brand, earning } = req.body;
    if (!userId || !brand || typeof earning !== 'number') {
      return res.status(400).json({ error: 'userId brand and earning are required' });
    }
    if (earning < 0) {
      return res.status(400).json({ error: 'earning cannot be negative' });
    }
    if (!c.userRepo.exists(userId)) {
      return res.status(400).json({ error: 'unknown user' });
    }
    if (!c.brandRepo.exists(brand)) {
      return res.status(400).json({ error: 'unknown brand' });
    }
    const sale = c.saleRepo.create(userId, brand, rupeesToPaise(earning));
    res.status(201).json(sale);
  });

  // reconcile a sale to approved or rejected
  router.post('/sales/:id/reconcile', (req, res) => {
    const { status } = req.body;
    const result = c.reconciliationService.reconcile(req.params.id, status);
    res.json(result);
  });

  return router;
};
