import { useState, useEffect } from 'react'

import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec']

interface RawRow {
  date: string
  amount: number
  type: 'income' | 'expense'
  categories: { name: string; color: string | null; icon: string | null } | null
}

export interface MonthlyPoint {
  month: string
  income: number
  expense: number
}

export interface CategoryStat {
  name: string
  icon: string | null
  color: string | null
  total: number
  pct: number
}

export interface IzvestajiData {
  monthly: MonthlyPoint[]
  incomeByCategory: CategoryStat[]
  expenseByCategory: CategoryStat[]
  totalIncome: number
  totalExpense: number
  loading: boolean
  error: string | null
}

export function useIzvestaji(year: number): IzvestajiData {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Omit<IzvestajiData, 'loading' | 'error'>>({
    monthly: MONTH_LABELS.map(m => ({ month: m, income: 0, expense: 0 })),
    incomeByCategory: [],
    expenseByCategory: [],
    totalIncome: 0,
    totalExpense: 0,
  })

  useEffect(() => {
    if (!user) return

    const fetchData = async (): Promise<void> => {
      setLoading(true)
      setError(null)

      const { data: rows, error: fetchError } = await supabase
        .from('transactions')
        .select('date, amount, type, categories(name, color, icon)')
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)

      if (fetchError) {
        setError('Greška pri učitavanju podataka.')
        setLoading(false)
        return
      }

      const transactions = (rows ?? []) as unknown as RawRow[]
      const monthly = MONTH_LABELS.map(m => ({ month: m, income: 0, expense: 0 }))
      const incomeMap = new Map<string, CategoryStat>()
      const expenseMap = new Map<string, CategoryStat>()
      let sumIncome = 0
      let sumExpense = 0

      for (const t of transactions) {
        const idx = new Date(t.date).getMonth()
        const amount = Number(t.amount)
        const catName = t.categories?.name ?? 'Ostalo'
        const catIcon = t.categories?.icon ?? null
        const catColor = t.categories?.color ?? null

        if (t.type === 'income') {
          monthly[idx].income += amount
          sumIncome += amount
          const existing = incomeMap.get(catName)
          incomeMap.set(catName, { name: catName, icon: catIcon, color: catColor, total: (existing?.total ?? 0) + amount, pct: 0 })
        } else {
          monthly[idx].expense += amount
          sumExpense += amount
          const existing = expenseMap.get(catName)
          expenseMap.set(catName, { name: catName, icon: catIcon, color: catColor, total: (existing?.total ?? 0) + amount, pct: 0 })
        }
      }

      const toSorted = (map: Map<string, CategoryStat>, total: number): CategoryStat[] =>
        Array.from(map.values())
          .sort((a, b) => b.total - a.total)
          .map(c => ({ ...c, pct: total > 0 ? Math.round((c.total / total) * 100) : 0 }))

      setData({
        monthly,
        incomeByCategory: toSorted(incomeMap, sumIncome),
        expenseByCategory: toSorted(expenseMap, sumExpense),
        totalIncome: sumIncome,
        totalExpense: sumExpense,
      })
      setLoading(false)
    }

    fetchData()
  }, [user, year])

  return { ...data, loading, error }
}
