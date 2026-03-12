const { getPool } = require("../utils/database");
const { toCamelCase } = require("../utils/rowMapper");

/**
 * Récupère le profil restaurateur par user_id.
 */
async function findByUserId(userId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT user_id AS "userId", nom_etablissement AS "nomEtablissement",
     adresse, code_postal AS "codePostal", ville, telephone, email,
     nombre_couverts AS "nombreCouverts", type_cuisine AS "typeCuisine",
     created_at AS "createdAt", updated_at AS "updatedAt"
     FROM restaurateur_profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

/**
 * Insère ou met à jour le profil (upsert).
 * Données attendues en camelCase.
 */
async function upsert(userId, data) {
  const pool = getPool();
  const {
    nomEtablissement,
    adresse,
    codePostal,
    ville,
    telephone,
    email,
    nombreCouverts,
    typeCuisine,
  } = data;

  const result = await pool.query(
    `INSERT INTO restaurateur_profiles (
      user_id, nom_etablissement, adresse, code_postal, ville,
      telephone, email, nombre_couverts, type_cuisine, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      nom_etablissement = EXCLUDED.nom_etablissement,
      adresse = EXCLUDED.adresse,
      code_postal = EXCLUDED.code_postal,
      ville = EXCLUDED.ville,
      telephone = EXCLUDED.telephone,
      email = EXCLUDED.email,
      nombre_couverts = EXCLUDED.nombre_couverts,
      type_cuisine = EXCLUDED.type_cuisine,
      updated_at = NOW()`,
    [
      userId,
      nomEtablissement ?? null,
      adresse ?? null,
      codePostal ?? null,
      ville ?? null,
      telephone ?? null,
      email ?? null,
      nombreCouverts ? parseInt(nombreCouverts, 10) : null,
      typeCuisine ?? null,
    ]
  );

  return findByUserId(userId);
}

module.exports = {
  findByUserId,
  upsert,
};
