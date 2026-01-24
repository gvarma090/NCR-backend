const express = require('express');
const router = express.Router();
const db = require('../db');

/* =========================
   GET PENDING DRIVERS
========================= */
router.get('/drivers/pending', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id,
        u.phone,
        u.vehicle_type,
        u.approval_status
      FROM users u
      INNER JOIN driver_documents d
        ON d.user_id = u.id
      WHERE u.role = 'DRIVER'
        AND u.approval_status = 'PENDING'
      ORDER BY u.created_at ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('ADMIN PENDING ERROR:', err);
    res.status(500).json({ error: 'Failed to load pending drivers' });
  }
});

/* =========================
   APPROVE DRIVER
========================= */
router.post('/driver/approve', async (req, res) => {
  const { userId } = req.body;

  await db.query(
    `UPDATE users
     SET approval_status='APPROVED',
         approved_at=NOW()
     WHERE id=$1`,
    [userId]
  );

  res.json({ message: 'Driver approved' });
});

/* =========================
   REJECT DRIVER
========================= */
router.post('/driver/reject', async (req, res) => {
  const { userId } = req.body;

  await db.query(
    `UPDATE users
     SET approval_status='REJECTED'
     WHERE id=$1`,
    [userId]
  );

  res.json({ message: 'Driver rejected' });
});

/* =========================
   LIVE RIDES
========================= */
router.get('/rides/live', async (req, res) => {
  const result = await db.query(`
    SELECT id, source, destination, status
    FROM rides
    WHERE status IN ('REQUESTED','ACCEPTED','ONGOING')
    ORDER BY created_at DESC
  `);

  res.json(result.rows);
});
/* =========================
   GET ALL DRIVERS (FILTER)
========================= */
router.get('/drivers', async (req, res) => {
  const { status, vehicle } = req.query;

  let conditions = [`role='DRIVER'`];
  let values = [];

  if (status) {
    values.push(status);
    conditions.push(`approval_status=$${values.length}`);
  }

  if (vehicle) {
    values.push(vehicle);
    conditions.push(`vehicle_type=$${values.length}`);
  }

  const query = `
    SELECT id, phone, vehicle_type, approval_status, blocked
    FROM users
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
  `;

  const result = await db.query(query, values);
  res.json(result.rows);
});

/* =========================
   BLOCK / UNBLOCK DRIVER
========================= */
router.post('/driver/block', async (req, res) => {
  const { userId, blocked } = req.body;

  await db.query(
    `UPDATE users
     SET blocked=$2
     WHERE id=$1`,
    [userId, blocked]
  );

  res.json({
    message: blocked ? 'Driver blocked' : 'Driver unblocked'
  });
});


module.exports = router;

