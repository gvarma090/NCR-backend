const express = require('express');
const router = express.Router();
const { completeRide } = require('../services/rideCompleteService');

router.post('/complete', async (req, res) => {
  try {
    const result = await completeRide(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;

