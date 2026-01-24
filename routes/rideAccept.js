const express = require('express');
const router = express.Router();
const { acceptRide, rejectRide } = require('../services/rideAcceptService');

router.post('/accept', async (req, res) => {
  try {
    const result = await acceptRide(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/reject', async (_req, res) => {
  res.json({ success: true });
});

module.exports = router;

