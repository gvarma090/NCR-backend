const db = require('../db');

async function completeRide({ rideId, driverUserId }) {
  const result = await db.query(
    `
    UPDATE rides
    SET
      status = 'COMPLETED',
      completed_at = NOW()
    WHERE id = $1
      AND driver_user_id = $2
      AND status = 'ONGOING'
    RETURNING id, locked_price
    `,
    [rideId, driverUserId]
  );

  if (!result.rows.length) {
    throw new Error('Ride cannot be completed');
  }

  return {
    success: true,
    rideId,
    finalAmount: result.rows[0].locked_price
  };
}

module.exports = {
  completeRide
};

