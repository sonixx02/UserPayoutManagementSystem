const express = require('express');

// routes for payouts
module.exports = function payoutRoutes(c) {
  const router = express.Router();

  // update payout status 
  router.post('/payouts/:id/status', (req, res) => {
    const { status } = req.body;
    const result = c.payoutService.updateStatus(req.params.id, status);
    res.json(result);
  });

  return router;
};
