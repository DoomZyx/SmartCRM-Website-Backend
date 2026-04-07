
ALTER TABLE restaurateur_profiles
  ADD COLUMN IF NOT EXISTS twilio_number_usage TEXT;

COMMENT ON COLUMN restaurateur_profiles.twilio_number_usage IS 'Description fournie par le client pour l''usage prévu du numéro Twilio (conformité).';
