/**
 * Initialise le schéma PostgreSQL (users, contacts, demos, restaurateur_profiles).
 * Exécute schema.sql puis la migration restaurateur_profiles pour les BDD existantes.
 * Usage: npm run db:init (DATABASE_URL dans .env ou config.env)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
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

async function init() {
  if (!connectionString && !process.env.PGHOST) {
    console.error("Définir DATABASE_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE");
    process.exit(1);
  }
  const pool = new Pool(getPoolConfig());
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "db", "schema.sql"),
    "utf8"
  );
  const statements = sql
    .split(";")
    .map((s) => s.replace(/--[^\n]*/g, "").trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await pool.query(statement + ";");
  }
  const migrationsDir = path.join(__dirname, "..", "db", "migrations");
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      const migrationStatements = migrationSql
        .split(";")
        .map((s) => s.replace(/--[^\n]*/g, "").trim())
        .filter((s) => s.length > 0);
      for (const statement of migrationStatements) {
        await pool.query(statement + ";");
      }
    }
  }
  console.log("Schéma PostgreSQL initialisé (users, contacts, demos, restaurateur_profiles, migrations).");
  await pool.end();
}

init().catch((err) => {
  console.error(err);
  process.exit(1);
});
