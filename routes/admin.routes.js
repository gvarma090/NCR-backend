const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   GET ALL DRIVERS (FILTERED)
========================= */
router.get("/drivers", async (req, res) => {
  try {
    const { status, vehicle } = req.query;

    let conditions = [`u.role='DRIVER'`];
    let params = [];

    if (status) {
      params.push(status);
      conditions.push(`u.approval_status = $${params.length}`);
    }

    if (vehicle) {
      params.push(vehicle);
      conditions.push(`dv.vehicle_type = $${params.length}`);
    }

    const query = `
      SELECT
        u.id,
        u.phone,
        u.approval_status,
        u.blocked,
        dv.vehicle_type,
        dd.license_number,
        dd.rc_number,
        dd.vehicle_plate
      FROM users u
      LEFT JOIN driver_vehicles dv ON dv.user_id = u.id
      LEFT JOIN driver_documents dd ON dd.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.created_at DESC
    `;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN DRIVER LIST ERROR:", err);
    res.status(500).json([]);
  }
});

/* =========================
   APPROVE DRIVER
========================= */
router.post("/drivers/approve", async (req, res) => {
  const { userId } = req.body;
  await db.query(
    `UPDATE users SET approval_status='APPROVED' WHERE id=$1`,
    [userId]
  );
  await db.query(
    `UPDATE driver_vehicles SET approved=true WHERE user_id=$1`,
    [userId]
  );
  res.json({ success: true });
});

/* =========================
   BLOCK / UNBLOCK DRIVER
========================= */
router.post("/drivers/block", async (req, res) => {
  const { userId, blocked } = req.body;
  await db.query(
    `UPDATE users SET blocked=$1 WHERE id=$2`,
    [blocked, userId]
  );
  res.json({ success: true });
});

module.exports = router;

