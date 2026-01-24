const { getPricingRule } = require('../db/pricingRepo')

function resolvePricePerKm(min, max, demandLevel) {
  if (demandLevel === 'LOW') return min
  if (demandLevel === 'HIGH') return max
  return Number(((min + max) / 2).toFixed(2))
}

async function calculatePrice({
  distanceKm,
  subscription,
  vehicleType,
  cabType = null,
  demandLevel
}) {
  if (distanceKm <= 0) {
    throw new Error('Invalid distance')
  }

  const { min_price_per_km, max_price_per_km } =
    await getPricingRule({ subscription, vehicleType, cabType })

  const pricePerKm = resolvePricePerKm(
    min_price_per_km,
    max_price_per_km,
    demandLevel
  )

  const soloPrice = Number((pricePerKm * distanceKm).toFixed(2))
  const sharedPrice = Number((soloPrice / 2).toFixed(2))

  return {
    distanceKm,
    pricePerKm,
    soloPrice,
    sharedPrice,
    appliedMin: min_price_per_km,
    appliedMax: max_price_per_km,
    demandLevel
  }
}

module.exports = {
  calculatePrice
}

