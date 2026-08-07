-- Custom slug prefix for Meta report share links (suffix is stored in meta_report_access_token).
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_meta_report_slug_idx
  ON accounts (meta_report_slug)
  WHERE meta_report_slug IS NOT NULL AND meta_report_slug <> '';
