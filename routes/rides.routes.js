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
      `
      INSERT INTO rides
      (customer_phone, source, destination, fare, vehicle_type, ride_mode, status, estimated_price)
      VALUES ($1,$2,$3,$4,$5,$6,'REQUESTED',$4)
      RETURNING *
      `,
      [customerPhone, source, destination, fare, vehicleType, rideMode]
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error("request error", e);
    res.status(500).json({ message: "Ride request failed" });
  }
});

/* =========================
   CUSTOMER → RIDE STATUS
========================= */
router.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT
        id,
        status,
        driver_user_id,
        vehicle_type,
        ride_mode,
        locked_price
      FROM rides
      WHERE id = $1
      `,
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
   DRIVER → PENDING RIDES
========================= */
router.get("/pending", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json([]);

    const vehiclesRes = await db.query(
      `
      SELECT vehicle_type
      FROM driver_vehicles
      WHERE user_id = $1 AND approved = true
      `,
      [userId]
    );

    if (!vehiclesRes.rows.length) return res.json([]);

    const vehicleTypes = vehiclesRes.rows.map(v => v.vehicle_type);

    const ridesRes = await db.query(
      `
      SELECT
        id,
        customer_phone,
        source,
        destination,
        estimated_price,
        vehicle_type,
        ride_mode
      FROM rides
      WHERE status = 'REQUESTED'
        AND vehicle_type = ANY($1)
      ORDER BY id DESC
      `,
      [vehicleTypes]
    );

    res.json(ridesRes.rows);
  } catch (e) {
    console.error("pending rides error", e);
    res.json([]);
  }
});

module.exports = router;

