/**
 * Mappe une ligne PostgreSQL (snake_case) vers un objet camelCase pour l'app.
 */
function toCamelCase(row) {
  if (!row) return null;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

function mapRows(rows) {
  return rows ? rows.map(toCamelCase) : [];
}

module.exports = { toCamelCase, mapRows };
