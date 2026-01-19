const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   ADMIN → LIST DRIVERS
========================= */
router.get("/drivers", async (req, res) => {
  const result = await db.query(`
    SELECT
      u.phone,
      dv.vehicle_type,
      COALESCE(dv.approved,false) AS approved
    FROM public.users u
    LEFT JOIN public.driver_vehicles dv
      ON u.phone = dv.phone
    WHERE u.role='DRIVER'
    ORDER BY u.created_at DESC
  `);

  res.json(
    result.rows.map(r => ({
      phone: r.phone,
      vehicleType: r.vehicle_type,
      approvalStatus: r.approved ? "APPROVED" : "PENDING"
    }))
  );
});

/* =========================
   ADMIN → APPROVE DRIVER VEHICLE ✅ (MISSING!)
========================= */
router.post("/driver/approve", async (req, res) => {
  const { phone, vehicleType } = req.body;

  if (!phone || !vehicleType) {
    return res.status(400).json({ message: "phone & vehicleType required" });
  }

  await db.query(
    `INSERT INTO public.driver_vehicles (phone, vehicle_type, approved)
     VALUES ($1,$2,true)
     ON CONFLICT (phone, vehicle_type)
     DO UPDATE SET approved=true`,
    [phone, vehicleType]
  );

  res.json({ success: true });
});

/* =========================
   ADMIN → BLOCK DRIVER VEHICLE
========================= */
router.post("/driver/block", async (req, res) => {
  const { phone, vehicleType } = req.body;

  if (!phone || !vehicleType) {
    return res.status(400).json({ message: "phone & vehicleType required" });
  }

  await db.query(
    `UPDATE public.driver_vehicles
     SET approved=false
     WHERE phone=$1 AND vehicle_type=$2`,
    [phone, vehicleType]
  );

  res.json({ success: true });
});

/* =========================
   DRIVER → APPROVED CHECK
========================= */
router.get("/driver/approved/:phone", async (req, res) => {
  const result = await db.query(
    `SELECT 1
     FROM public.driver_vehicles
     WHERE phone=$1 AND approved=true
     LIMIT 1`,
    [req.params.phone]
  );

  res.json({ approved: result.rows.length > 0 });
});

module.exports = router;

