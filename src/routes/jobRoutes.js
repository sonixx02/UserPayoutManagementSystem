const express = require('express');

// routes for background jobs
module.exports = function jobRoutes(c) {
  const router = express.Router();

  // run the advance payout job for a user
  router.post('/jobs/advance-payout', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const result = c.advanceService.runForUser(userId);
    res.json(result);
  });

  return router;
};
