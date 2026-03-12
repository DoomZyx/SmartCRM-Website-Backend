const { getPool } = require("../utils/database");
const { toCamelCase, mapRows } = require("../utils/rowMapper");

const STATUS_VALUES = ["nouveau", "en_cours", "traité", "archivé"];

function validateStatus(status) {
  return status && STATUS_VALUES.includes(status);
}

async function create({ name, email, company, subject, message }) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO contacts (name, email, company, subject, message) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, company, subject, message, status, created_at AS "createdAt"`,
    [name, email, company || null, subject, message]
  );
  return toCamelCase(result.rows[0]);
}

async function findWithFilter({ status, limit, offset }) {
  const pool = getPool();
  let query =
    "SELECT id, name, email, company, subject, message, status, created_at AS \"createdAt\" FROM contacts";
  const params = [];
  if (status && validateStatus(status)) {
    params.push(status);
    query += " WHERE status = $1";
  }
  query += " ORDER BY created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
  params.push(limit, offset);
  const result = await pool.query(query, params);
  return mapRows(result.rows);
}

async function countFilter(status) {
  const pool = getPool();
  let query = "SELECT COUNT(*)::int AS total FROM contacts";
  const params = [];
  if (status && validateStatus(status)) {
    params.push(status);
    query += " WHERE status = $1";
  }
  const result = await pool.query(query, params);
  return result.rows[0].total;
}

async function findById(id) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, name, email, company, subject, message, status, created_at AS \"createdAt\" FROM contacts WHERE id = $1",
    [id]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function updateStatus(id, status) {
  if (!validateStatus(status)) return null;
  const pool = getPool();
  const result = await pool.query(
    `UPDATE contacts SET status = $2, updated_at = NOW() WHERE id = $1
     RETURNING id, name, email, company, subject, message, status, created_at AS "createdAt"`,
    [id, status]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

module.exports = {
  create,
  findWithFilter,
  countFilter,
  findById,
  updateStatus,
  validateStatus,
};
