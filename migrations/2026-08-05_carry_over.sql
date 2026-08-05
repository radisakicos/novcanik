-- ============================================================
-- Prenos salda (carry-over balance) — settings kolone
-- Pokrenuti ručno u Supabase SQL Editoru.
-- ============================================================

ALTER TABLE public.settings
  ADD COLUMN carry_over_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN carry_over_affects_budget boolean NOT NULL DEFAULT false,
  ADD COLUMN carry_over_start_date date;
