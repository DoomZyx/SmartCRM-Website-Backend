/**
 * audit-fix: Vérification des variables d'environnement critiques au démarrage.
 * Usage: node scripts/preflight.js (CLI) ou require et appeler runPreflight() avant connectDB.
 */
function runPreflight() {
  const checks = [
    { name: "JWT_SECRET", minLen: 32 },
    { name: "STRIPE_SECRET_KEY", minLen: 1 },
    { name: "STRIPE_WEBHOOK_SECRET", minLen: 1 },
  ];

  const dbOk =
    process.env.DATABASE_URL ||
    (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD);

  if (!dbOk) {
    throw new Error("Preflight: DATABASE_URL ou (PGHOST + PGUSER + PGPASSWORD) requis.");
  }

  for (const { name, minLen } of checks) {
    const v = process.env[name];
    if (!v || typeof v !== "string" || v.length < minLen) {
      throw new Error(`Preflight: ${name} manquante ou trop courte (min ${minLen} caractères).`);
    }
  }
}

if (require.main === module) {
  require("dotenv").config();
  try {
    runPreflight();
    console.log("Preflight: variables critiques OK.");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = { runPreflight };
