import { supabase } from './supabase'

/**
 * Sums income − expense for all transactions strictly before `beforeDate`,
 * starting from `sinceDate` (the date carry-over was activated).
 */
export async function getOpeningBalance(
  userId: string,
  sinceDate: string,
  beforeDate: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('date', sinceDate)
    .lt('date', beforeDate)

  if (error || !data) return 0

  return data.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
}
