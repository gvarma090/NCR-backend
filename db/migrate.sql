-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(10),
  approval_status VARCHAR(20),
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RIDES TABLE
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone VARCHAR(20) NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  fare INTEGER NOT NULL,
  vehicle_type VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'REQUESTED',
  driver_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES (IMPORTANT FOR SCALE)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_vehicle ON rides(vehicle_type);

