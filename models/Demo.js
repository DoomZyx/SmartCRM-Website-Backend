const { getPool } = require("../utils/database");
const { toCamelCase, mapRows } = require("../utils/rowMapper");

async function create({ name, email, company, teamSize, needs, preferredTime, duration }) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO demos (name, email, company, team_size, needs, preferred_time, duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, company, team_size AS "teamSize", needs, preferred_time AS "preferredTime", duration, created_at AS "createdAt"`,
    [name, email, company, teamSize, needs, preferredTime, duration]
  );
  return toCamelCase(result.rows[0]);
}

async function findAll() {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, email, company, team_size AS "teamSize", needs, preferred_time AS "preferredTime", duration, created_at AS "createdAt"
     FROM demos ORDER BY created_at DESC`
  );
  return mapRows(result.rows);
}

async function findById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, email, company, team_size AS "teamSize", needs, preferred_time AS "preferredTime", duration, created_at AS "createdAt"
     FROM demos WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

module.exports = {
  create,
  findAll,
  findById,
};
