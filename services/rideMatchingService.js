const db = require('../db')
const { canDriverGoOnline } = require('./driverAccessService')

/**
 * Returns list of drivers eligible to see a ride
 * Uses UUID-based user model (users.id)
 */
async function getEligibleDriversForRide({
  vehicleType,
  rideType // 'SOLO' or 'SHARED'
}) {
  // 1. Load drivers with matching vehicle
  const driversRes = await db.query(
    `
    SELECT 
      u.id AS user_id,
      u.phone
    FROM users u
    JOIN driver_vehicles dv ON dv.user_id = u.id
    WHERE u.role = 'DRIVER'
      AND u.approval_status = 'APPROVED'
      AND u.blocked = FALSE
      AND dv.vehicle_type = $1
      AND dv.approved = TRUE
    `,
    [vehicleType]
  )

  const eligibleDrivers = []

  // 2. Apply online / subscription / trial gate
  for (const row of driversRes.rows) {
    const access = await canDriverGoOnline(row.user_id)

    if (!access.allowed) continue

    eligibleDrivers.push({
      userId: row.user_id,
      phone: row.phone,
      vehicleType,
      rideType,
      reason:
        rideType === 'SHARED'
          ? 'Shared ride eligible'
          : 'Solo ride eligible'
    })
  }

  return eligibleDrivers
}

module.exports = {
  getEligibleDriversForRide
}

