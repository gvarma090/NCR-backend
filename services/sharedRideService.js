/**
 * Determines whether shared rides are allowed
 * and calculates shared price.
 *
 * This service does NOT calculate base price.
 * It only applies business rules on top of pricing engine output.
 */

function isSharedAllowed({ subscriptionPlan, vehicleType }) {
  if (subscriptionPlan === 'FREE') return false
  if (vehicleType === 'BIKE') return false
  return true
}

function applySharedPricing({ soloPrice, sharedRequested }) {
  if (!sharedRequested) {
    return {
      rideType: 'SOLO',
      finalPrice: soloPrice
    }
  }

  return {
    rideType: 'SHARED',
    finalPrice: Number((soloPrice / 2).toFixed(2))
  }
}

module.exports = {
  isSharedAllowed,
  applySharedPricing
}

