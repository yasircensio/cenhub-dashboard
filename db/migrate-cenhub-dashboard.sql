ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS cenhub_dashboard BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE accounts
SET cenhub_dashboard = TRUE
WHERE cenhub_dashboard = FALSE
  AND (
    (location_id IS NOT NULL AND btrim(location_id) <> '')
    OR (ghl_token_encrypted IS NOT NULL AND ghl_token_encrypted <> '')
  );
