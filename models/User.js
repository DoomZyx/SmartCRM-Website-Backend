const { getPool } = require("../utils/database");
const { toCamelCase } = require("../utils/rowMapper");

async function findById(id) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, email, name, google_id AS \"googleId\", avatar, created_at AS \"createdAt\", updated_at AS \"updatedAt\" FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
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

module.exports = {
  findById,
  findByEmailOrGoogleId,
  create,
  updateGoogleLink,
};
