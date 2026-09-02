import { supabase } from './supabase'

/**
 * Normalizes a carry-over start date to the first day of its month.
 *
 * Carry-over is a month-granular feature: what a user has left at the end of a
 * month rolls into the next one. A start date saved mid-month would carry only
 * the tail of the activation month forward — typically expenses without the
 * income that arrived earlier that month — producing a large false deficit.
 */
export function toMonthStart(date: string): string {
  return `${date.slice(0, 7)}-01`
}

/**
 * Sums income − expense for all transactions from the start of the month in
 * which carry-over was activated up to, but excluding, `beforeDate`.
 */
export async function getOpeningBalance(
  userId: string,
  sinceDate: string,
  beforeDate: string,
): Promise<number> {
  const since = toMonthStart(sinceDate)

  // The activation month itself has nothing to carry in, and any month before it
  // is out of scope — both yield an empty range, so skip the round trip.
  if (since >= beforeDate) return 0

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('date', since)
    .lt('date', beforeDate)

  // Never fall back to 0 here: a silent zero renders as a plausible balance and
  // the user has no way to tell a real result from a failed query.
  if (error) throw new Error(`getOpeningBalance failed: ${error.message}`)

  return (data ?? []).reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
}
