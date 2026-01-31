const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/documents", async (req, res) => {
  try {
    console.log("📥 RECEIVED DOCUMENT SUBMISSION:", req.body);

    const {
      phone,
      vehicleType,
      licenseNumber,
      rcNumber,
      vehiclePlate,
      aadharNumber,
    } = req.body;

    // 1. Check Payload
    if (!phone || !licenseNumber || !rcNumber || !vehiclePlate || !aadharNumber || !vehicleType) {
      console.error("❌ MISSING FIELDS. Required: phone, vehicleType, licenseNumber, rcNumber, vehiclePlate, aadharNumber");
      return res.status(400).json({ message: "Missing required fields (check console)" });
    }

    // 2. Find User
    const userRes = await db.query(`SELECT id, role FROM users WHERE phone=$1`, [phone]);
    
    if (userRes.rows.length === 0) {
      console.error(`❌ USER NOT FOUND for phone: ${phone}`);
      return res.status(400).json({ message: `User with phone ${phone} not found` });
    }

    const user = userRes.rows[0];
    console.log("✅ USER FOUND:", user);

    // 3. Fix Role if needed
    if (user.role !== 'DRIVER') {
        console.log("🔄 UPDATING ROLE TO DRIVER...");
        await db.query(`UPDATE users SET role='DRIVER' WHERE id=$1`, [user.id]);
    }

    // 4. Insert Documents
    console.log("💾 INSERTING INTO DB...");
    await db.query(
      `
      INSERT INTO driver_documents (
        user_id, license_number, license_image, rc_number, 
        vehicle_plate, vehicle_type, aadhar_number, selfie_image
      )
      VALUES ($1, $2, 'PENDING', $3, $4, $5, $6, 'PENDING')
      ON CONFLICT (user_id)
      DO UPDATE SET
        license_number = EXCLUDED.license_number,
        rc_number      = EXCLUDED.rc_number,
        vehicle_plate  = EXCLUDED.vehicle_plate,
        vehicle_type   = EXCLUDED.vehicle_type,
        aadhar_number  = EXCLUDED.aadhar_number
      `,
      [user.id, licenseNumber, rcNumber, vehiclePlate, vehicleType, aadharNumber]
    );

    console.log("✅ DOCUMENTS SAVED SUCCESSFULLY");
    res.json({ success: true });

  } catch (err) {
    console.error("🔥 DATABASE ERROR:", err.message);
    // Send the specific DB error to the frontend for debugging
    res.status(500).json({ message: "Database Error: " + err.message });
  }
});

module.exports = router;
