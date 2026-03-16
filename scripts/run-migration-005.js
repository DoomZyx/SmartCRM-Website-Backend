/**
 * Exécute uniquement la migration 005 (stripe_webhook_events).
 * Usage: node scripts/run-migration-005.js (depuis website/backend, .env chargé)
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
    path.join(__dirname, "..", "db", "migrations", "005_stripe_webhook_events.sql"),
    "utf8"
  );
  await pool.query(sql);
  console.log("Migration 005 (stripe_webhook_events) appliquée.");
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
