const db = require('../db')

async function getPricingRule({ subscription, vehicleType, cabType }) {
  const result = await db.query(
    `
    SELECT 
      min_price_per_km::FLOAT AS min_price_per_km,
      max_price_per_km::FLOAT AS max_price_per_km
    FROM pricing_rules
    WHERE subscription_plan = $1
      AND vehicle_type = $2
      AND (cab_type = $3 OR $3 IS NULL)
    `,
    [subscription, vehicleType, cabType]
  )

  if (result.rows.length === 0) {
    throw new Error('Pricing rule not found')
  }

  return result.rows[0]
}

module.exports = {
  getPricingRule
}

