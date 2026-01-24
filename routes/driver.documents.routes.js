const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/documents', async (req, res) => {
  try {
    const {
      userId,
      licenseNumber,
      licenseImage,
      rcNumber,
      vehiclePlate,
      aadharNumber,
      selfieImage,
    } = req.body;

    if (
      !userId ||
      !licenseNumber ||
      !licenseImage ||
      !rcNumber ||
      !vehiclePlate ||
      !aadharNumber ||
      !selfieImage
    ) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    await db.query(
      `INSERT INTO driver_documents
       (user_id, license_number, license_image, rc_number, vehicle_plate, aadhar_number, selfie_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        userId,
        licenseNumber,
        licenseImage,
        rcNumber,
        vehiclePlate,
        aadharNumber,
        selfieImage,
      ]
    );

    await db.query(
      `UPDATE users
       SET approval_status='PENDING'
       WHERE id=$1`,
      [userId]
    );

    res.json({ message: 'Documents submitted. Await admin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Document upload failed' });
  }
});

module.exports = router;

