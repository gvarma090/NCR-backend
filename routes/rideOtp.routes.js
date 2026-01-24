router.post("/complete", async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ error: "Missing rideId" });

    const ride = await db.query(
      `
      SELECT status
      FROM rides
      WHERE id = $1
      `,
      [rideId]
    );

    if (!ride.rows.length) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // ✅ ONLY ONGOING RIDES CAN COMPLETE
    if (ride.rows[0].status !== 'ONGOING') {
      return res.status(400).json({ error: "Ride cannot be completed" });
    }

    await db.query(
      `
      UPDATE rides
      SET status = 'COMPLETED',
          completed_at = NOW()
      WHERE id = $1
      `,
      [rideId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("COMPLETE ERROR:", err);
    res.status(500).json({ error: "Ride completion failed" });
  }
});

