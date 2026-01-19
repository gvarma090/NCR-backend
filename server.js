require("dotenv").config();
const express = require("express");
const cors = require("cors");

const initDB = require("./db/init");   // 🔑 IMPORTANT
const authRoutes = require("./routes/auth.routes");
const rideRoutes = require("./routes/rides.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

/* HEALTH */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/admin", adminRoutes);

/* ADMIN UI */
app.use("/admin", express.static(__dirname + "/admin"));
app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/admin/index.html");
});

/* 🔥 START SERVER ONLY AFTER DB INIT */
(async () => {
  try {
    await initDB();                // ✅ CREATE TABLES
    app.listen(PORT, () => {
      console.log("🚀 Backend running on port " + PORT);
    });
  } catch (err) {
    console.error("❌ DB init failed", err);
    process.exit(1);
  }
})();

