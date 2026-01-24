const db = require('../db')

/**
 * Platform subscription prices (monthly)
 */
const VEHICLE_PRICES = {
  BIKE: 100,
  AUTO: 200,
  CAB: 500
}

/**
 * Determines whether a driver can go ONLINE
 * Uses UUID-based user model
 * Uses DB time for trial checks (timezone-safe)
 */
async function canDriverGoOnline(userId) {
  /**
   * 1. Load user
   */
  const userRes = await db.query(
    `
    SELECT
      id,
      role,
      approval_status,
      approved_at,
      blocked
    FROM users
    WHERE id = $1
    `,
    [userId]
  )

  if (userRes.rows.length === 0) {
    return { allowed: false, reason: 'User not found' }
  }

  const user = userRes.rows[0]

  if (user.role !== 'DRIVER') {
    return { allowed: false, reason: 'Not a driver account' }
  }

  if (user.approval_status !== 'APPROVED') {
    return { allowed: false, reason: 'Driver not approved' }
  }

  if (user.blocked) {
    return { allowed: false, reason: 'Driver blocked by admin' }
  }

  /**
   * 2. Load approved vehicle
   */
  const vehicleRes = await db.query(
    `
    SELECT vehicle_type
    FROM driver_vehicles
    WHERE user_id = $1
      AND approved = TRUE
    `,
    [userId]
  )

  if (vehicleRes.rows.length === 0) {
    return { allowed: false, reason: 'Vehicle not approved' }
  }

  const vehicleType = vehicleRes.rows[0].vehicle_type

  /**
   * 3. Check active paid subscription
   */
  const subRes = await db.query(
    `
    SELECT 1
    FROM driver_subscriptions
    WHERE user_id = $1
      AND is_active = TRUE
      AND end_date >= CURRENT_DATE
    LIMIT 1
    `,
    [userId]
  )

  if (subRes.rows.length > 0) {
    return {
      allowed: true,
      reason: 'Active subscription',
      vehicleType,
      price: VEHICLE_PRICES[vehicleType]
    }
  }

  /**
   * 4. Check 30-day free trial (DB-time based, timezone safe)
   */
  if (!user.approved_at) {
    return { allowed: false, reason: 'Approval date missing' }
  }

  const trialRes = await db.query(
    `
    SELECT
      approved_at,
      approved_at + INTERVAL '30 days' AS trial_end,
      NOW() <= approved_at + INTERVAL '30 days' AS trial_active
    FROM users
    WHERE id = $1
    `,
    [userId]
  )

  const trial = trialRes.rows[0]

  if (trial.trial_active) {
    return {
      allowed: true,
      reason: 'Within 30-day free trial',
      trialEndsOn: trial.trial_end,
      vehicleType,
      price: 0
    }
  }

  /**
   * 5. Trial expired and no subscription
   */
  return {
    allowed: false,
    reason: 'Trial expired. Subscription required.',
    vehicleType,
    price: VEHICLE_PRICES[vehicleType]
  }
}

module.exports = {
  canDriverGoOnline,
  VEHICLE_PRICES
}

