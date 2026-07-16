-- Meta / Facebook direct API integration (per-client ad account + encrypted tokens)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_page_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_system_user_token_encrypted TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_page_access_token_encrypted TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_sync_status TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_sync_error TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_last_synced_at TIMESTAMPTZ;
