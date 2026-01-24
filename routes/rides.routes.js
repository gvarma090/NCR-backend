const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   CUSTOMER → REQUEST
========================= */
router.post("/request", async (req, res) => {
  try {
    const { customerPhone, source, destination, fare, vehicleType, rideMode = "KING" } = req.body;

    if (!customerPhone || !source || !destination || fare == null || !vehicleType) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const active = await db.query(
      `SELECT id FROM rides
       WHERE customer_phone=$1
       AND status IN ('REQUESTED','ASSIGNED','ONGOING')`,
      [customerPhone]
    );

    if (active.rows.length) {
      return res.status(400).json({ error: "Customer already has active ride" });
    }

    const ride = await db.query(
      `
      INSERT INTO rides (
        customer_phone, source, destination,
        fare, estimated_price,
        vehicle_type, ride_mode, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,'REQUESTED')
      RETURNING *
      `,
      [
        customerPhone,
        source,
        destination,
        fare,
        Number(fare),
        vehicleType,
        rideMode,
      ]
    );

    res.json(ride.rows[0]);
  } catch (e) {
    console.error("REQUEST ERROR:", e);
    res.status(500).json({ error: "Ride request failed" });
  }
});

/* =========================
   DRIVER → ACCEPT
========================= */
router.post("/accept", async (req, res) => {
  try {
    const { rideId, driverPhone, driverUserId } = req.body;
    if (!rideId || !driverPhone || !driverUserId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const ride = await db.query(
      `SELECT status FROM rides WHERE id=$1`,
      [rideId]
    );

    if (!ride.rows.length || ride.rows[0].status !== 'REQUESTED') {
      return res.status(400).json({ error: "Ride already accepted" });
    }

    const updated = await db.query(
      `
      UPDATE rides
      SET status='ASSIGNED',
          driver_phone=$1,
          driver_user_id=$2,
          locked_price=estimated_price,
          accepted_at=NOW()
      WHERE id=$3
      RETURNING *
      `,
      [driverPhone, driverUserId, rideId]
    );

    res.json(updated.rows[0]);
  } catch (e) {
    console.error("ACCEPT ERROR:", e);
    res.status(500).json({ error: "Accept failed" });
  }
});

/* =========================
   OTP → GENERATE
========================= */
router.post("/otp/generate", async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ error: "Missing rideId" });

    const ride = await db.query(
      `SELECT status FROM rides WHERE id=$1`,
      [rideId]
    );

    if (!ride.rows.length || !['ASSIGNED','ONGOING'].includes(ride.rows[0].status)) {
      return res.status(400).json({ error: "OTP not allowed" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await db.query(
      `UPDATE rides SET start_otp=$1 WHERE id=$2`,
      [otp, rideId]
    );

    res.json({ success: true, otp });
  } catch (e) {
    console.error("OTP GEN ERROR:", e);
    res.status(500).json({ error: "OTP generation failed" });
  }
});

/* =========================
   OTP → VERIFY
========================= */
router.post("/otp/verify", async (req, res) => {
  try {
    const { rideId, otp } = req.body;
    if (!rideId || !otp) return res.status(400).json({ error: "Missing fields" });

    const ride = await db.query(
      `SELECT start_otp FROM rides WHERE id=$1`,
      [rideId]
    );

    if (!ride.rows.length || ride.rows[0].start_otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await db.query(
      `
      UPDATE rides
      SET status='ONGOING',
          otp_verified=true,
          started_at=NOW()
      WHERE id=$1
      `,
      [rideId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error("OTP VERIFY ERROR:", e);
    res.status(500).json({ error: "OTP verify failed" });
  }
});

/* =========================
   DRIVER → COMPLETE
========================= */
router.post("/complete", async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ error: "Missing rideId" });

    const ride = await db.query(
      `SELECT status FROM rides WHERE id=$1`,
      [rideId]
    );

    if (!ride.rows.length || ride.rows[0].status !== 'ONGOING') {
      return res.status(400).json({ error: "Ride cannot be completed" });
    }

    await db.query(
      `
      UPDATE rides
      SET status='COMPLETED',
          completed_at=NOW()
      WHERE id=$1
      `,
      [rideId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error("COMPLETE ERROR:", e);
    res.status(500).json({ error: "Completion failed" });
  }
});

/* =========================
   DRIVER → PENDING
========================= */
router.get("/pending", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json([]);

    const vehicles = await db.query(
      `SELECT vehicle_type FROM driver_vehicles WHERE phone=$1 AND approved=true`,
      [phone]
    );

    if (!vehicles.rows.length) return res.json([]);

    const types = vehicles.rows.map(v => v.vehicle_type);

    const rides = await db.query(
      `
      SELECT id, customer_phone, source, destination,
             fare, estimated_price, vehicle_type, ride_mode
      FROM rides
      WHERE status='REQUESTED'
      AND vehicle_type = ANY($1)
      `,
      [types]
    );

    res.json(rides.rows);
  } catch (e) {
    console.error("PENDING ERROR:", e);
    res.json([]);
  }
});

module.exports = router;

