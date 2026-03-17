const bcrypt = require("bcryptjs");
const { getPool } = require("../utils/database");
const { toCamelCase } = require("../utils/rowMapper");

const SALT_ROUNDS = 12;

async function findById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, name, google_id AS "googleId", avatar, plan_id AS "planId",
            stripe_subscription_id AS "stripeSubscriptionId",
            smartcrm_instance_id AS "smartcrmInstanceId",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function findByEmail(email) {
  if (!email || typeof email !== "string") return null;
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, name, google_id AS "googleId", avatar, plan_id AS "planId",
            stripe_subscription_id AS "stripeSubscriptionId",
            smartcrm_instance_id AS "smartcrmInstanceId",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1`,
    [email]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

/**
 * Hash et enregistre le mot de passe pour l'utilisateur (requêtes paramétrées).
 */
async function setPassword(userId, plainPassword) {
  if (!userId || !plainPassword || typeof plainPassword !== "string") return false;
  const trimmed = plainPassword.trim();
  if (trimmed.length < 8) return false;
  const hash = await bcrypt.hash(trimmed, SALT_ROUNDS);
  const pool = getPool();
  await pool.query(
    `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
    [userId, hash]
  );
  return true;
}

/**
 * Vérifie le mot de passe pour un utilisateur (compare au hash stocké).
 */
async function verifyPassword(userId, plainPassword) {
  if (!userId || !plainPassword || typeof plainPassword !== "string") return false;
  const pool = getPool();
  const result = await pool.query(
    `SELECT password_hash FROM users WHERE id = $1 AND password_hash IS NOT NULL`,
    [userId]
  );
  const hash = result.rows[0]?.password_hash;
  if (!hash) return false;
  return bcrypt.compare(plainPassword.trim(), hash);
}

async function findByEmailOrGoogleId(email, googleId) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, email, name, google_id AS \"googleId\", avatar, created_at AS \"createdAt\" FROM users WHERE email = $1 OR (google_id IS NOT NULL AND google_id = $2) LIMIT 1",
    [email, googleId || null]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function create({ email, name, googleId, avatar }) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO users (email, name, google_id, avatar) VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, google_id AS "googleId", avatar, created_at AS "createdAt"`,
    [email, name || null, googleId || null, avatar || null]
  );
  return toCamelCase(result.rows[0]);
}

async function updateGoogleLink(id, { googleId, avatar, name }) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET google_id = COALESCE($2, google_id), avatar = COALESCE($3, avatar), name = COALESCE($4, name), updated_at = NOW()
     WHERE id = $1 RETURNING id, email, name, google_id AS "googleId", avatar, created_at AS "createdAt"`,
    [id, googleId || null, avatar || null, name || null]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

/**
 * Met à jour l'abonnement utilisateur après un checkout Stripe réussi (webhook).
 */
async function updateSubscription(userId, { planId, stripeSubscriptionId }) {
  const pool = getPool();
  await pool.query(
    `UPDATE users SET plan_id = $2, stripe_subscription_id = $3, updated_at = NOW() WHERE id = $1`,
    [userId, planId ?? null, stripeSubscriptionId ?? null]
  );
}

/**
 * Enregistre l'instance SmartCRM créée après paiement (instanceId + apiKey à transmettre une fois).
 */
async function updateSmartcrmInstance(userId, { instanceId, apiKey }) {
  const pool = getPool();
  await pool.query(
    `UPDATE users SET smartcrm_instance_id = $2, tenant_api_key = $3, updated_at = NOW() WHERE id = $1`,
    [userId, instanceId ?? null, apiKey ?? null]
  );
}

/**
 * Retourne la clé API tenant une seule fois puis la supprime de la base (ne pas logger).
 * Note: on ne supprime plus la clé après lecture pour permettre l'accès à l'app intégrée via le proxy.
 */
async function getTenantApiKeyOnce(userId) {
  const pool = getPool();
  const select = await pool.query(
    `SELECT tenant_api_key FROM users WHERE id = $1 AND tenant_api_key IS NOT NULL`,
    [userId]
  );
  return select.rows[0]?.tenant_api_key ?? null;
}

/**
 * Retourne la clé API tenant pour l'utilisateur (usage backend uniquement, ex. proxy app).
 * Ne pas logger cette valeur.
 */
async function getTenantApiKey(userId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT tenant_api_key FROM users WHERE id = $1 AND tenant_api_key IS NOT NULL`,
    [userId]
  );
  return result.rows[0]?.tenant_api_key ?? null;
}

/**
 * Trouve un utilisateur par l'instance SmartCRM associée (pour notification numéro définitif).
 */
async function findBySmartcrmInstanceId(instanceId) {
  if (!instanceId || typeof instanceId !== "string" || !instanceId.trim()) return null;
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, name, smartcrm_instance_id AS "smartcrmInstanceId"
     FROM users WHERE smartcrm_instance_id = $1 LIMIT 1`,
    [instanceId.trim()]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

module.exports = {
  findById,
  findByEmail,
  findByEmailOrGoogleId,
  create,
  updateGoogleLink,
  updateSubscription,
  updateSmartcrmInstance,
  getTenantApiKeyOnce,
  getTenantApiKey,
  setPassword,
  verifyPassword,
  findBySmartcrmInstanceId,
};
