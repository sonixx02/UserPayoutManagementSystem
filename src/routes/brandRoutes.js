const express = require('express');

// routes for brands
module.exports = function brandRoutes(c) {
  const router = express.Router();

  // create a brand or update its rate
  router.post('/brands', (req, res) => {
    const { name, advanceRateBps } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (
      advanceRateBps !== undefined &&
      (typeof advanceRateBps !== 'number' || advanceRateBps < 0 || advanceRateBps > 10000)
    ) {
      return res.status(400).json({ error: 'advanceRateBps must be between 0 and 10000' });
    }
    const brand = c.brandRepo.create(name, advanceRateBps);
    res.status(201).json(brand);
  });

  // list all brands
  router.get('/brands', (req, res) => {
    res.json(c.brandRepo.list());
  });

  return router;
};
