const crypto = require('crypto');
const db = require('../db');

function generateOtp() {
  return crypto.randomInt(1000, 9999).toString();
}

async function generateRideOtp(rideId) {
  const otp = generateOtp();

  const result = await db.query(
    `
    UPDATE rides
    SET start_otp = $1
    WHERE id = $2
      AND status = 'ASSIGNED'
    RETURNING id
    `,
    [otp, rideId]
  );

  if (!result.rows.length) {
    throw new Error('OTP generation failed');
  }

  return otp;
}

async function verifyRideOtp({ rideId, otp }) {
  const result = await db.query(
    `
    UPDATE rides
    SET
      otp_verified = TRUE,
      status = 'ONGOING',
      started_at = NOW()
    WHERE id = $1
      AND start_otp = $2
      AND status = 'ASSIGNED'
    RETURNING id
    `,
    [rideId, otp]
  );

  if (!result.rows.length) {
    throw new Error('Invalid OTP or ride not ready');
  }

  return { success: true };
}

module.exports = {
  generateRideOtp,
  verifyRideOtp
};

