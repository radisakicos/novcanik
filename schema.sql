-- ============================================================
-- Novčanik — Database Schema
-- ============================================================
-- This file documents the full database structure and Row Level
-- Security policies. It proves that no one — including the app
-- author — has access to another user's data. Every query is
-- enforced at the database level via RLS.
-- ============================================================

-- ------------------------------------------------------------
-- CATEGORIES
-- User-defined income/expense categories with drag-and-drop order
-- ------------------------------------------------------------
CREATE TABLE public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL CHECK (type IN ('income', 'expense')),
  icon       text,
  color      text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: korisnik vidi samo svoje"
  ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories: korisnik unosi svoje"
  ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories: korisnik mijenja svoje"
  ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories: korisnik briše svoje"
  ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- TRANSACTIONS
-- Every financial transaction tied to a category
-- ------------------------------------------------------------
CREATE TABLE public.transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         date NOT NULL,
  amount       numeric(12,2) NOT NULL,
  type         text NOT NULL CHECK (type IN ('income', 'expense')),
  category_id  uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  note         text,
  account_name text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions: korisnik vidi samo svoje"
  ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions: korisnik unosi svoje"
  ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions: korisnik mijenja svoje"
  ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions: korisnik briše svoje"
  ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- SETTINGS
-- Per-user app settings (theme, currency, display name)
-- Note: id = auth.users.id (1-to-1 relationship)
-- ------------------------------------------------------------
CREATE TABLE public.settings (
  id                         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme                      text NOT NULL DEFAULT 'light',
  currency                   text NOT NULL DEFAULT 'RSD',
  onboarding_completed       boolean NOT NULL DEFAULT false,
  full_name                  text,
  -- Prenos salda: kad je uključen, Dashboard balans i (opciono) Budžet
  -- uračunavaju kumulativni saldo od carry_over_start_date nadalje.
  carry_over_enabled         boolean NOT NULL DEFAULT false,
  carry_over_affects_budget  boolean NOT NULL DEFAULT false,
  carry_over_start_date      date
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings: korisnik vidi samo svoje"
  ON public.settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "settings: korisnik unosi svoje"
  ON public.settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "settings: korisnik mijenja svoje"
  ON public.settings FOR UPDATE USING (auth.uid() = id);

-- ------------------------------------------------------------
-- BUDGET SETTINGS
-- Monthly budget allocation percentages and income override
-- ------------------------------------------------------------
CREATE TABLE public.budget_settings (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  income_override numeric(12,2),
  bills_pct       integer NOT NULL DEFAULT 50,
  spending_pct    integer NOT NULL DEFAULT 20,
  investing_pct   integer NOT NULL DEFAULT 20,
  giving_pct      integer NOT NULL DEFAULT 10
);

ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budget settings"
  ON public.budget_settings FOR ALL USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- FIXED COSTS
-- Recurring monthly expenses (rent, utilities, subscriptions)
-- ------------------------------------------------------------
CREATE TABLE public.fixed_costs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  amount     numeric(12,2) NOT NULL,
  notes      text,
  -- Koja budžetska kofa nosi ovaj trošak. 'bills' (default) se oduzima iz
  -- zajedničkog preostalog budžeta; ostale kategorije se prikazuju kao već
  -- rezervisan iznos unutar svog slajdera (npr. kreditna rata pod 'investing').
  category   text NOT NULL DEFAULT 'bills' CHECK (category IN ('bills', 'spending', 'investing', 'giving')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fixed costs"
  ON public.fixed_costs FOR ALL USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- BUDGET RULES
-- Custom allocation rules linking percentages to categories
-- ------------------------------------------------------------
CREATE TABLE public.budget_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  percentage   integer NOT NULL,
  category_ids uuid[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_rules: korisnik vidi samo svoje"
  ON public.budget_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budget_rules: korisnik unosi svoje"
  ON public.budget_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budget_rules: korisnik mijenja svoje"
  ON public.budget_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budget_rules: korisnik briše svoje"
  ON public.budget_rules FOR DELETE USING (auth.uid() = user_id);
