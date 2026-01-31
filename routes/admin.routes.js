const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   GET ALL DRIVERS
========================= */
router.get("/drivers", async (req, res) => {
  try {
    const { status, vehicle } = req.query;
    let conditions = [`UPPER(u.role)='DRIVER'`];
    let params = [];

    if (status) {
      params.push(status);
      conditions.push(`u.approval_status = $${params.length}`);
    }

    if (vehicle) {
      params.push(vehicle);
      conditions.push(`dd.vehicle_type = $${params.length}`);
    }

    // Return blocked status directly from DB
    const query = `
      SELECT 
        u.id, 
        u.phone, 
        u.approval_status, 
        u.blocked, 
        dd.vehicle_type,
        dd.license_number,
        dd.vehicle_plate
      FROM users u
      LEFT JOIN driver_documents dd ON dd.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.created_at DESC
    `;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN ERROR:", err);
    res.status(500).json([]);
  }
});

/* =========================
   BLOCK / UNBLOCK
========================= */
router.post("/drivers/block", async (req, res) => {
  const { userId, blocked } = req.body;
  
  if (!userId) return res.status(400).json({ error: "ID missing" });

  try {
    // Ensure Boolean
    const finalStatus = (blocked === true || blocked === "true" || blocked === 1);
    
    // Update using UUID
    await db.query(
      `UPDATE users SET blocked=$1 WHERE id=$2`,
      [finalStatus, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("BLOCK FAIL:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   APPROVE
========================= */
router.post("/drivers/approve", async (req, res) => {
  const { userId } = req.body;
  try {
    await db.query(`UPDATE users SET approval_status='APPROVED' WHERE id=$1`, [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Approve failed" });
  }
});

/* =========================
   CHECK DRIVER STATUS (For App)
========================= */
router.get("/driver/status", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: "Phone required" });

    // Check users table
    const result = await db.query(
      `SELECT approval_status FROM users WHERE phone=$1`,
      [phone]
    );

    if (result.rows.length) {
      // Returns: { status: 'PENDING' } or { status: 'APPROVED' }
      res.json({ status: result.rows[0].approval_status });
    } else {
      // User not found
      res.json({ status: 'NEW' });
    }
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ message: "Error checking status" });
  }
});
module.exports = router;
