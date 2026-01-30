const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   SUBMIT DRIVER DOCUMENTS
========================= */
router.post("/documents", async (req, res) => {
  try {
    const {
      phone,
      licenseNumber,
      rcNumber,
      vehiclePlate,
      aadharNumber,
    } = req.body;

    if (!phone || !licenseNumber || !rcNumber || !vehiclePlate || !aadharNumber) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔍 Find driver
    const userRes = await db.query(
      `SELECT id FROM users WHERE phone=$1 AND role='DRIVER'`,
      [phone]
    );

    if (!userRes.rows.length) {
      return res.status(400).json({ message: "Invalid driver" });
    }

    const userId = userRes.rows[0].id;

    // ✅ ALWAYS WRITE IMAGE COLUMNS
    await db.query(
      `
      INSERT INTO driver_documents (
        user_id,
        license_number,
        license_image,
        rc_number,
        vehicle_plate,
        aadhar_number,
        selfie_image
      )
      VALUES (
        $1,
        $2,
        'PENDING_UPLOAD',
        $3,
        $4,
        $5,
        'PENDING_UPLOAD'
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        license_number = EXCLUDED.license_number,
        license_image  = 'PENDING_UPLOAD',
        rc_number      = EXCLUDED.rc_number,
        vehicle_plate  = EXCLUDED.vehicle_plate,
        aadhar_number  = EXCLUDED.aadhar_number,
        selfie_image   = 'PENDING_UPLOAD'
      `,
      [userId, licenseNumber, rcNumber, vehiclePlate, aadharNumber]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DOCUMENT SUBMIT ERROR:", err);
    res.status(500).json({ message: "Failed to submit documents" });
  }
});

module.exports = router;

