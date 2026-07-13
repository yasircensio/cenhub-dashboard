-- Staff login tables (run once against Neon Postgres)

CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES staff_users (id) ON DELETE SET NULL,
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS staff_users_status_idx ON staff_users (status);
CREATE INDEX IF NOT EXISTS staff_users_role_idx ON staff_users (role);

CREATE TABLE IF NOT EXISTS staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES staff_users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS staff_sessions_user_id_idx ON staff_sessions (user_id);
CREATE INDEX IF NOT EXISTS staff_sessions_expires_at_idx ON staff_sessions (expires_at);

CREATE TABLE IF NOT EXISTS password_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES staff_users (id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('set_password', 'reset_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_tokens_user_id_idx ON password_tokens (user_id);
CREATE INDEX IF NOT EXISTS password_tokens_expires_at_idx ON password_tokens (expires_at);
