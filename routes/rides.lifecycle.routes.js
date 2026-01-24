const express = require('express');
const router = express.Router();
const db = require('../db');

/* DRIVER → CANCEL (within 60s, before ONGOING) */
router.post('/cancel', async (req, res) => {
  const { rideId } = req.body;

  try {
    const ride = await db.query(
      `SELECT status, accepted_at FROM rides WHERE id=$1`,
      [rideId]
    );

    if (!ride.rows.length) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const { status, accepted_at } = ride.rows[0];

    if (status !== 'ASSIGNED') {
      return res.status(400).json({ error: 'Cancel not allowed' });
    }

    const diff =
      (Date.now() - new Date(accepted_at).getTime()) / 1000;

    if (diff > 60) {
      return res.status(400).json({ error: 'Cancel window expired' });
    }

    await db.query(
      `UPDATE rides SET status='REQUESTED',
       driver_phone=NULL,
       driver_user_id=NULL,
       accepted_at=NULL
       WHERE id=$1`,
      [rideId]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Cancel failed' });
  }
});

/* CUSTOMER / DRIVER → LIVE STATUS */
router.get('/status/:id', async (req, res) => {
  const { id } = req.params;

  const r = await db.query(
    `SELECT status, driver_phone FROM rides WHERE id=$1`,
    [id]
  );

  if (!r.rows.length) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  res.json(r.rows[0]);
});

module.exports = router;

