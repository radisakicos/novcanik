-- ============================================================
-- Normalize carry_over_start_date to the first day of its month
-- ============================================================
-- Carry-over is month-granular. A start date stored mid-month made the
-- opening balance carry only the tail of the activation month forward
-- (expenses without the income that arrived earlier that month).
--
-- The application already normalizes on read (src/lib/openingBalance.ts),
-- so this migration is data hygiene, not a correctness requirement.
-- It only moves dates backward to the 1st; no transaction data is touched.

update settings
   set carry_over_start_date = date_trunc('month', carry_over_start_date)::date
 where carry_over_start_date is not null
   and extract(day from carry_over_start_date) <> 1;
