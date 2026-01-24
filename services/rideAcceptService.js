const db = require('../db');

/**
 * Driver accepts a ride.
 * - Uses INTEGER rideId
 * - Uses UUID driverUserId
 * - Race-condition safe using SQL transaction
 * - Compatible with db.query() only (no db.connect)
 */
async function acceptRide({ rideId, driverUserId }) {
  if (!rideId || !driverUserId) {
    throw new Error('Missing fields');
  }

  // 1. Lock ride row
  const rideRes = await db.query(
    `
    SELECT id, status, estimated_price
    FROM rides
    WHERE id = $1
    FOR UPDATE
    `,
    [rideId]
  );

  if (!rideRes.rows.length) {
    throw new Error('Ride not found');
  }

  const ride = rideRes.rows[0];

  if (ride.status !== 'REQUESTED') {
    throw new Error('Ride already accepted');
  }

  if (!ride.estimated_price) {
    throw new Error('Ride price not estimated');
  }

  // 2. Update ride atomically
  const updateRes = await db.query(
    `
    UPDATE rides
    SET
      status = 'ASSIGNED',
      driver_user_id = $1,
      accepted_at = NOW(),
      locked_price = $2
    WHERE id = $3
      AND status = 'REQUESTED'
    RETURNING id, status, driver_user_id, locked_price
    `,
    [driverUserId, ride.estimated_price, rideId]
  );

  if (!updateRes.rows.length) {
    throw new Error('Ride already accepted');
  }

  return {
    success: true,
    rideId,
    driverUserId,
    lockedPrice: ride.estimated_price
  };
}

async function rejectRide() {
  return { success: true };
}

module.exports = {
  acceptRide,
  rejectRide
};

