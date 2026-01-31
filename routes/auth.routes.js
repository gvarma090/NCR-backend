const express = require("express");
const router = express.Router();
const db = require("../db");

/* =========================
   LOGIN / REGISTER (SAFE)
========================= */
router.post("/login", async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone || !role) {
      return res.status(400).json({ message: "Missing phone or role" });
    }

    // 1️⃣ Find user by PHONE ONLY (single source of truth)
    const userRes = await db.query(
      `SELECT id, phone, role, approval_status, blocked
       FROM public.users
       WHERE phone = $1
       LIMIT 1`,
      [phone]
    );

    let user;

    if (userRes.rows.length === 0) {
      // 🆕 First time ever → create user
      const insertRes = await db.query(
        `INSERT INTO public.users
         (phone, role, approval_status, blocked)
         VALUES ($1, $2, 'PENDING', false)
         RETURNING id, phone, role, approval_status, blocked`,
        [phone, role]
      );

      user = insertRes.rows[0];
    } else {
      // ✅ Existing user → NEVER touch approval_status
      user = userRes.rows[0];

      // Update role ONLY if changed
      if (user.role !== role) {
        await db.query(
          `UPDATE public.users
           SET role = $2
           WHERE phone = $1`,
          [phone, role]
        );

        user.role = role;
      }
    }

    res.json({
      phone: user.phone,
      role: user.role,
      approval_status: user.approval_status,
      blocked: user.blocked,
    });
  } catch (err) {
    console.error("AUTH LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;

