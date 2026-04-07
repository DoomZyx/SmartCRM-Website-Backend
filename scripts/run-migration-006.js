/**
 * Migration 006 : twilio_docs_submitted_at sur users.
 * Usage: node scripts/run-migration-006.js (depuis website/backend)
 */
require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.PGHOST && {
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || "smartcrm",
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

function getPoolConfig() {
  if (typeof connectionString === "string") {
    const isSupabase = connectionString.includes("supabase");
    return {
      connectionString,
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
    };
  }
  return connectionString;
}

async function run() {
  if (!connectionString && !process.env.PGHOST) {
    console.error("Définir DATABASE_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE");
    process.exit(1);
  }
  const pool = new Pool(getPoolConfig());
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "db", "migrations", "006_twilio_docs_submitted.sql"),
    "utf8"
  );
  await pool.query(sql);
  console.log("Migration 006 (twilio_docs_submitted_at) appliquée.");
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
