-- Migration : ajout du pays sur le profil restaurateur
ALTER TABLE restaurateur_profiles
  ADD COLUMN IF NOT EXISTS pays VARCHAR(100);
