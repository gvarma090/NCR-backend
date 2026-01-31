const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   DRIVER STATUS (APP)
========================= */
router.get("/status", async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: "Phone required" });
    }

    // 1️⃣ Find user
    const userRes = await db.query(
      `SELECT id, approval_status
       FROM users
       WHERE phone = $1`,
      [phone]
    );

    if (userRes.rows.length === 0) {
      return res.json({
        status: "NEW",
        hasDocuments: false,
      });
    }

    const user = userRes.rows[0];

    // 2️⃣ Check documents
    const docsRes = await db.query(
      `SELECT 1
       FROM driver_documents
       WHERE user_id = $1
       LIMIT 1`,
      [user.id]
    );

    res.json({
      status: user.approval_status,   // NEW | PENDING | APPROVED
      hasDocuments: docsRes.rows.length > 0,
    });
  } catch (err) {
    console.error("DRIVER STATUS ERROR:", err);
    res.status(500).json({ message: "Status check failed" });
  }
});

module.exports = router;

