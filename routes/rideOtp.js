const express = require('express');
const router = express.Router();
const {
  generateRideOtp,
  verifyRideOtp
} = require('../services/rideOtpService');

/**
 * TESTING ONLY
 * Generates OTP and returns it directly
 */
router.post('/otp/generate', async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) {
      return res.status(400).json({ error: 'rideId required' });
    }

    const otp = await generateRideOtp(rideId);

    // ⚠️ TEST MODE: returning OTP directly
    res.json({
      success: true,
      rideId,
      otp
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * Verify OTP and start ride
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const { rideId, otp } = req.body;
    if (!rideId || !otp) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const result = await verifyRideOtp({ rideId, otp });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;

