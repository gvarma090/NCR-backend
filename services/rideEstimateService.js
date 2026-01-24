const { calculatePrice } = require('./pricingService')
const {
  isSharedAllowed,
  applySharedPricing
} = require('./sharedRideService')

async function estimateRide({
  distanceKm,
  subscription,
  vehicleType,
  cabType,
  demandLevel,
  sharedRequested
}) {
  // 1. Calculate SOLO price first (always)
  const pricing = await calculatePrice({
    distanceKm,
    subscription,
    vehicleType,
    cabType,
    demandLevel
  })

  // 2. Check shared eligibility
  const sharedAllowed = isSharedAllowed({
    subscriptionPlan: subscription,
    vehicleType
  })

  if (sharedRequested && !sharedAllowed) {
    throw new Error('Shared rides not allowed for this plan or vehicle')
  }

  // 3. Apply shared pricing if applicable
  const pricingResult = applySharedPricing({
    soloPrice: pricing.soloPrice,
    sharedRequested
  })

  return {
    distanceKm,
    vehicleType,
    cabType: cabType || null,
    subscription,
    demandLevel,
    sharedAllowed,
    rideType: pricingResult.rideType,
    price: pricingResult.finalPrice,
    breakdown: {
      soloPrice: pricing.soloPrice,
      sharedPrice: Number((pricing.soloPrice / 2).toFixed(2))
    }
  }
}

module.exports = {
  estimateRide
}

