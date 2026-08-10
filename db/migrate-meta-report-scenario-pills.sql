ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS meta_report_scenario_smooth_uneven BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS meta_report_scenario_blend_history BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS meta_report_scenario_include_trend BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS meta_report_scenario_caution_strong_months BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE accounts SET meta_report_scenario_include_trend = TRUE
  WHERE meta_report_scenario_trend_method IN ('robust_trend', 'conservative_blend');

UPDATE accounts SET meta_report_scenario_blend_history = TRUE, meta_report_scenario_caution_strong_months = TRUE
  WHERE meta_report_scenario_trend_method = 'conservative_blend';
