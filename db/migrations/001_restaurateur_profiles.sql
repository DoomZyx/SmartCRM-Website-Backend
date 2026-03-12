-- Migration : ajout de la table restaurateur_profiles (à exécuter si la BDD existait avant)
-- Usage: psql $DATABASE_URL -f db/migrations/001_restaurateur_profiles.sql

CREATE TABLE IF NOT EXISTS restaurateur_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nom_etablissement VARCHAR(200),
  adresse VARCHAR(300),
  code_postal VARCHAR(10),
  ville VARCHAR(100),
  telephone VARCHAR(30),
  email VARCHAR(255),
  nombre_couverts INTEGER,
  type_cuisine VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurateur_profiles_user_id ON restaurateur_profiles(user_id);
