const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   LOGIN / REGISTER
========================= */
router.post("/login", async (req, res) => {
  try {
    const { phone, role, vehicleType } = req.body;

    if (!phone || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }

    /* 1️⃣ CHECK IF USER EXISTS */
    const userRes = await db.query(
      `SELECT * FROM public.users WHERE phone=$1 AND role=$2 LIMIT 1`,
      [phone, role]
    );

    let user;

    if (userRes.rows.length) {
      // ✅ USER EXISTS → DO NOT TOUCH approval_status
      user = userRes.rows[0];
    } else {
      // 🆕 NEW USER → default approval PENDING
      const insertRes = await db.query(
        `INSERT INTO public.users
         (phone, role, approval_status, blocked)
         VALUES ($1,$2,'PENDING',false)
         RETURNING *`,
        [phone, role]
      );
      user = insertRes.rows[0];
    }

    /* 2️⃣ DRIVER VEHICLE HANDLING */
    if (role === "DRIVER" && vehicleType) {
      await db.query(
        `INSERT INTO public.driver_vehicles
         (phone, vehicle_type, approved)
         VALUES ($1,$2,true)
         ON CONFLICT (phone, vehicle_type) DO NOTHING`,
        [phone, vehicleType]
      );
    }

    res.json({
      phone: user.phone,
      role: user.role,
      approval_status: user.approval_status,
    });
  } catch (e) {
    console.error("login error", e);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;

