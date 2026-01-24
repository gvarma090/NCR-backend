const express = require('express')
const router = express.Router()
const { estimateRide } = require('../services/rideEstimateService')

router.post('/estimate', async (req, res) => {
  try {
    const result = await estimateRide(req.body)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router

