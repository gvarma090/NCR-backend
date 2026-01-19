// backend/db/index.js
const { Pool } = require("pg");

const pool = new Pool({
  host: "ncr-postgres",
  port: 5432,
  database: "ncr",
  user: "ncr",
  password: "ncr",
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected to DB=ncr");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error", err);
  process.exit(1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};

