-- Migration : champs abonnement Stripe sur users
-- À exécuter après 001 (ou avec npm run db:init)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_id INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
