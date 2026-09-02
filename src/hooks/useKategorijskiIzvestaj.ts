import { useState, useEffect } from 'react'

import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { CategoryStat } from './useIzvestaji'

interface RawRow {
  date: string
  amount: number
  type: 'income' | 'expense'
  categories: { name: string; color: string | null; icon: string | null } | null
}

export interface KategorijskiData {
  incomeByCategory: CategoryStat[]
  expenseByCategory: CategoryStat[]
  totalIncome: number
  totalExpense: number
  loading: boolean
}

export function useKategorijskiIzvestaj(from: string, to: string): KategorijskiData {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Omit<KategorijskiData, 'loading'>>({
    incomeByCategory: [],
    expenseByCategory: [],
    totalIncome: 0,
    totalExpense: 0,
  })

  useEffect(() => {
    if (!user || !from || !to || from > to) return

    const fetchData = async (): Promise<void> => {
      setLoading(true)

      const { data: rows, error } = await supabase
        .from('transactions')
        .select('date, amount, type, categories(name, color, icon)')
        .gte('date', from)
        .lte('date', to)

      if (error) {
        setLoading(false)
        return
      }

      const transactions = (rows ?? []) as unknown as RawRow[]
      const incomeMap = new Map<string, CategoryStat>()
      const expenseMap = new Map<string, CategoryStat>()
      let sumIncome = 0
      let sumExpense = 0

      for (const t of transactions) {
        const amount = Number(t.amount)
        const catName = t.categories?.name ?? 'Ostalo'
        const catIcon = t.categories?.icon ?? null
        const catColor = t.categories?.color ?? null

        if (t.type === 'income') {
          sumIncome += amount
          const existing = incomeMap.get(catName)
          incomeMap.set(catName, { name: catName, icon: catIcon, color: catColor, total: (existing?.total ?? 0) + amount, pct: 0 })
        } else {
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
        incomeByCategory: toSorted(incomeMap, sumIncome),
        expenseByCategory: toSorted(expenseMap, sumExpense),
        totalIncome: sumIncome,
        totalExpense: sumExpense,
      })
      setLoading(false)
    }

    fetchData()
  }, [user, from, to])

  return { ...data, loading }
}
