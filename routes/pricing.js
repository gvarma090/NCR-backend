const express = require('express')
const router = express.Router()
const { calculatePrice } = require('../services/pricingService')

router.post('/calculate', async (req, res) => {
  try {
    const result = await calculatePrice(req.body)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router

