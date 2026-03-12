-- Schéma PostgreSQL SmartCRM
-- Exécuter une fois pour créer les tables (ex: psql $DATABASE_URL -f db/schema.sql)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(200),
  google_id VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(100),
  subject VARCHAR(200) NOT NULL,
  message VARCHAR(2000) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'traité', 'archivé')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_email_created ON contacts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_status_created ON contacts(status, created_at DESC);

CREATE TABLE IF NOT EXISTS demos (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(100) NOT NULL,
  team_size VARCHAR(20) NOT NULL,
  needs VARCHAR(500) NOT NULL,
  preferred_time VARCHAR(50) NOT NULL,
  duration VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demos_created ON demos(created_at DESC);

-- Profil restaurateur (1:1 avec users)
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
