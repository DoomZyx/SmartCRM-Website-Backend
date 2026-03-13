
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS smartcrm_instance_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tenant_api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_users_smartcrm_instance_id ON users(smartcrm_instance_id) WHERE smartcrm_instance_id IS NOT NULL;
