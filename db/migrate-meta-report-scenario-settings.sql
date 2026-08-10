ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS meta_report_scenario_trend_method TEXT NOT NULL DEFAULT 'recency_weighted',
  ADD COLUMN IF NOT EXISTS meta_report_scenario_month_window TEXT NOT NULL DEFAULT '6',
  ADD COLUMN IF NOT EXISTS meta_report_scenario_elasticity TEXT NOT NULL DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS meta_report_budget_multiplier NUMERIC NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS meta_report_budget_baseline TEXT NOT NULL DEFAULT 'year';
