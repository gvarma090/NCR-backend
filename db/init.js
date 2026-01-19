const db = require("../db"); // ✅ FIXED PATH

console.log("🔥 INIT.JS LOADED — driver_vehicles schema expected");

module.exports = async function initDB() {
  console.log("🔧 Checking DB schema...");

  /* USERS */
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      phone TEXT NOT NULL,
      role TEXT NOT NULL,
      approval_status TEXT DEFAULT 'PENDING',
      blocked BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      PRIMARY KEY (phone, role)
    )
  `);

  /* DRIVER VEHICLES */
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.driver_vehicles (
      phone TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      approved BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      PRIMARY KEY (phone, vehicle_type)
    )
  `);

  /* RIDES */
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.rides (
      id SERIAL PRIMARY KEY,
      customer_phone TEXT NOT NULL,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      fare INTEGER NOT NULL,
      vehicle_type TEXT NOT NULL,
      ride_mode TEXT NOT NULL CHECK (ride_mode IN ('KING','SHARED')),
      status TEXT DEFAULT 'REQUESTED',
      driver_phone TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      accepted_at TIMESTAMP,
      started_at TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);

  console.log("✅ DB schema ready (NO DATA LOSS)");
};

