import { useState, useEffect, useCallback } from 'react'

import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface TransactionWithCategory {
  id: string
  date: string
  amount: number
  type: 'income' | 'expense'
  note: string | null
  account_name: string | null
  category_id: string | null
  category_name: string | null
  category_color: string | null
}

interface RawRow {
  id: string
  date: string
  amount: number
  type: 'income' | 'expense'
  note: string | null
  account_name: string | null
  category_id: string | null
  categories: { name: string; color: string | null } | null
}

export function useTransactions(year: number, month: number) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (): Promise<void> => {
    if (!user) return

    setLoading(true)
    setError(null)

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

    const { data, error: fetchError } = await supabase
      .from('transactions')
      .select('id, date, amount, type, note, account_name, category_id, categories(name, color)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Greška pri učitavanju transakcija.')
      setLoading(false)
      return
    }

    const rows = (data ?? []) as unknown as RawRow[]
    setTransactions(rows.map(r => ({
      id: r.id,
      date: r.date,
      amount: r.amount,
      type: r.type,
      note: r.note,
      account_name: r.account_name,
      category_id: r.category_id,
      category_name: r.categories?.name ?? null,
      category_color: r.categories?.color ?? null,
    })))
    setLoading(false)
  }, [user, year, month])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { transactions, loading, error, refetch: fetch }
}
