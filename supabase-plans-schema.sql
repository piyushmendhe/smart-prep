-- Run this in Supabase SQL Editor after supabase-schema.sql

CREATE TABLE IF NOT EXISTS user_plans (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pro              BOOLEAN NOT NULL DEFAULT FALSE,
  plan_type           TEXT    NOT NULL DEFAULT 'free',  -- 'free' | 'monthly' | 'yearly' | 'lifetime'
  razorpay_payment_id TEXT,
  pro_since           TIMESTAMPTZ,
  pro_until           TIMESTAMPTZ,   -- NULL = lifetime / not yet expired
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Users can only read their own plan row
CREATE POLICY "Users can view own plan"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT / UPDATE policies — only service_role key (payment verification) can write

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW EXECUTE FUNCTION update_plans_updated_at();
