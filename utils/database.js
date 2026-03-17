const { Pool } = require("pg");
const dotenv = require("dotenv");
const { logger } = require("./logger");

dotenv.config();

/** Singleton : un seul Pool pour toute l'app. getPool() renvoie toujours cette instance (pas de new Pool par requête). */
let pool = null;

/**
 * Connexion PostgreSQL. Crée une seule fois le Pool (réutilisé par tous les modèles).
 * Utilise DATABASE_URL ou variables PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT.
 */
const connectDB = async () => {
  if (pool) {
    return pool;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    (process.env.PGHOST && {
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      database: process.env.PGDATABASE || "smartcrm",
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
    });

  if (!connectionString && !process.env.PGHOST) {
    throw new Error(
      "Variable d'environnement DATABASE_URL ou (PGHOST, PGUSER, PGPASSWORD, PGDATABASE) manquante."
    );
  }

  try {
    const poolConfig =
      typeof connectionString === "string"
        ? {
            connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: connectionString.includes("supabase")
              ? { rejectUnauthorized: false }
              : process.env.NODE_ENV === "production"
                ? { rejectUnauthorized: true }
                : false,
          }
        : {
            ...connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          };
    pool = new Pool(poolConfig);
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    logger.info("PostgreSQL connecté (pool unique, max 20 connexions).");
  } catch (error) {
    logger.error({ err: error.message }, "Erreur de connexion PostgreSQL");
    process.exit(1);
  }
  return pool;
};

/**
 * Retourne le Pool singleton. Ne crée jamais de nouveau Pool.
 */
function getPool() {
  if (!pool) {
    throw new Error("Pool PostgreSQL non initialisé. Appeler connectDB() au démarrage.");
  }
  return pool;
}

module.exports = { connectDB, getPool };
