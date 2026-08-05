-- ============================================================
-- Kategorija fiksnog troška (Računi / Trošenje / Investiranje / Davanje)
-- Pokrenuti ručno u Supabase SQL Editoru.
-- ============================================================

ALTER TABLE public.fixed_costs
  ADD COLUMN category text NOT NULL DEFAULT 'bills'
    CHECK (category IN ('bills', 'spending', 'investing', 'giving'));
