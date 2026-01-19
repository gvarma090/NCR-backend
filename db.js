const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,        // ← ncr-postgres
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};

