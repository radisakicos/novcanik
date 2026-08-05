import { useState, useEffect } from 'react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getOpeningBalance } from '../lib/openingBalance'

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

export interface CategorySummary {
  name: string
  value: number
  color: string
}

export interface RecentTransaction {
  id: string
  date: string
  amount: number
  type: 'income' | 'expense'
  note: string | null
  account_name: string | null
  category_name: string | null
  category_color: string | null
  category_icon: string | null
}

export interface DashboardData {
  totalIncome: number
  totalExpense: number
  openingBalance: number
  balance: number
  expenseByCategory: CategorySummary[]
  recentTransactions: RecentTransaction[]
  loading: boolean
  error: string | null
}

interface RawTransaction {
  id: string
  date: string
  amount: number
  type: 'income' | 'expense'
  note: string | null
  account_name: string | null
  categories: { name: string; color: string | null; icon: string | null } | null
}

export function useDashboard(year: number, month: number, refreshKey = 0): DashboardData {
  const { user, carryOverEnabled, carryOverStartDate } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Omit<DashboardData, 'loading' | 'error'>>({
    totalIncome: 0,
    totalExpense: 0,
    openingBalance: 0,
    balance: 0,
    expenseByCategory: [],
    recentTransactions: [],
  })

  useEffect(() => {
    if (!user) return

    const fetchData = async (): Promise<void> => {
      setLoading(true)
      setError(null)

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

      const openingBalance = carryOverEnabled && carryOverStartDate
        ? await getOpeningBalance(user.id, carryOverStartDate, startDate)
        : 0

      const { data: rows, error: fetchError } = await supabase
        .from('transactions')
        .select('id, date, amount, type, note, account_name, categories(name, color, icon)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError('Greška pri učitavanju podataka.')
        setLoading(false)
        return
      }

      const transactions = (rows ?? []) as unknown as RawTransaction[]

      let totalIncome = 0
      let totalExpense = 0
      const colorMap = new Map<string, string>()
      const expenseMap = new Map<string, number>()
      let colorIndex = 0

      transactions.forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amount
        } else {
          totalExpense += t.amount
          const key = t.categories?.name ?? 'Bez kategorije'
          if (!colorMap.has(key)) {
            colorMap.set(key, t.categories?.color ?? PRESET_COLORS[colorIndex++ % PRESET_COLORS.length])
          }
          expenseMap.set(key, (expenseMap.get(key) ?? 0) + t.amount)
        }
      })

      const expenseByCategory: CategorySummary[] = Array.from(expenseMap.entries())
        .map(([name, value]) => ({ name, value, color: colorMap.get(name)! }))
        .sort((a, b) => b.value - a.value)

      const recentTransactions: RecentTransaction[] = transactions.slice(0, 5).map(t => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        type: t.type,
        note: t.note,
        account_name: t.account_name,
        category_name: t.categories?.name ?? null,
        category_color: t.categories?.color ?? null,
        category_icon: t.categories?.icon ?? null,
      }))

      setResult({
        totalIncome,
        totalExpense,
        openingBalance,
        balance: openingBalance + totalIncome - totalExpense,
        expenseByCategory,
        recentTransactions,
      })
      setLoading(false)
    }

    fetchData()
  }, [user, year, month, refreshKey, carryOverEnabled, carryOverStartDate])

  return { ...result, loading, error }
}
