require("dotenv").config();
const express = require("express");
const cors = require("cors");

/* DB INIT */
const initDB = require("./db/init");

/* ROUTES */
const authRoutes = require("./routes/auth.routes");
const rideRoutes = require("./routes/rides.routes");
const adminRoutes = require("./routes/admin.routes");
const pricingRoutes = require("./routes/pricing");
const rideEstimateRoutes = require("./routes/rideEstimate");
const rideAcceptRoutes = require("./routes/rideAccept");
const rideOtpRoutes = require("./routes/rideOtp");       // ✅ OTP
const rideCompleteRoutes = require("./routes/rideComplete");
const debugMatchingRoutes = require("./routes/debugMatching");
const driverDocumentsRoutes = require('./routes/driver.documents.routes');

const app = express();
const PORT = process.env.PORT || 4000;

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());

/* HEALTH */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* API ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/pricing", pricingRoutes);

app.use("/api/rides", rideRoutes);
app.use("/api/rides", rideEstimateRoutes);
app.use("/api/rides", rideAcceptRoutes);
app.use("/api/rides", rideOtpRoutes);        // ✅ NOW REGISTERED
app.use("/api/rides", rideCompleteRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/debug", debugMatchingRoutes);
app.use('/api/driver', driverDocumentsRoutes);

/* ADMIN UI */
app.use("/admin", express.static(__dirname + "/admin"));
app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/admin/index.html");
});

/* START SERVER */
(async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`🚀 NCR Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ DB init failed", err);
    process.exit(1);
  }
})();

