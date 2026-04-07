
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS twilio_docs_submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN users.twilio_docs_submitted_at IS 'Date de réception du dossier Twilio (documents + coordonnées) depuis Mon espace.';
