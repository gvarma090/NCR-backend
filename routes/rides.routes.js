const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   CUSTOMER → REQUEST RIDE
========================= */
router.post("/request", async (req, res) => {
  try {
    const {
      customerPhone,
      source,
      destination,
      fare,
      vehicleType,
      rideMode = "KING",
    } = req.body;

    if (!customerPhone || !source || !destination || !fare || !vehicleType) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!["KING", "SHARED"].includes(rideMode)) {
      return res.status(400).json({ message: "Invalid ride mode" });
    }

    const result = await db.query(
      `INSERT INTO public.rides
       (customer_phone, source, destination, fare, vehicle_type, ride_mode, status)
       VALUES ($1,$2,$3,$4,$5,$6,'REQUESTED')
       RETURNING *`,
      [customerPhone, source, destination, fare, vehicleType, rideMode]
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error("request error", e);
    res.status(500).json({ message: "Ride request failed" });
  }
});

/* =========================
   CUSTOMER → RIDE STATUS (✅ MISSING FIX)
========================= */
router.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         id,
         status,
         driver_phone,
         vehicle_type,
         ride_mode
       FROM public.rides
       WHERE id=$1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("status error", e);
    res.status(500).json({ message: "Status check failed" });
  }
});

/* =========================
   DRIVER → ACCEPT RIDE
========================= */
router.post("/accept", async (req, res) => {
  try {
    const { id, driverPhone } = req.body;
    if (!id || !driverPhone) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const rideRes = await db.query(
      `SELECT vehicle_type, ride_mode
       FROM public.rides
       WHERE id=$1 AND status='REQUESTED'`,
      [id]
    );

    if (!rideRes.rows.length) {
      return res.status(400).json({ message: "Ride already taken" });
    }

    const { vehicle_type, ride_mode } = rideRes.rows[0];

    // 🚫 BLOCK RULES
    if (vehicle_type === "BIKE" || ride_mode === "KING") {
      const active = await db.query(
        `SELECT 1 FROM public.rides
         WHERE driver_phone=$1
           AND status IN ('ACCEPTED','ONGOING')
         LIMIT 1`,
        [driverPhone]
      );

      if (active.rows.length) {
        return res
          .status(400)
          .json({ message: "Driver already has an active ride" });
      }
    }

    const result = await db.query(
      `UPDATE public.rides
       SET status='ACCEPTED',
           driver_phone=$1,
           accepted_at=NOW()
       WHERE id=$2
         AND status='REQUESTED'
       RETURNING *`,
      [driverPhone, id]
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error("accept error", e);
    res.status(500).json({ message: "Accept failed" });
  }
});

/* =========================
   DRIVER → PENDING RIDES
========================= */
router.get("/pending", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json([]);

    const vehiclesRes = await db.query(
      `SELECT vehicle_type
       FROM public.driver_vehicles
       WHERE phone=$1 AND approved=true`,
      [phone]
    );

    if (!vehiclesRes.rows.length) return res.json([]);

    const vehicleTypes = vehiclesRes.rows.map(v => v.vehicle_type);

    const ridesRes = await db.query(
      `SELECT id, customer_phone, source, destination, fare, vehicle_type, ride_mode
       FROM public.rides
       WHERE status='REQUESTED'
         AND vehicle_type = ANY($1)
       ORDER BY id DESC`,
      [vehicleTypes]
    );

    res.json(ridesRes.rows);
  } catch (e) {
    console.error("pending rides error", e);
    res.json([]);
  }
});

module.exports = router;

