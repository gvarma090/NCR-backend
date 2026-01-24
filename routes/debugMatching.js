const express = require('express')
const router = express.Router()
const { getEligibleDriversForRide } = require('../services/rideMatchingService')

router.post('/match', async (req, res) => {
  try {
    const drivers = await getEligibleDriversForRide(req.body)
    res.json({ drivers })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router

