import { useState, useEffect, useCallback } from 'react'

import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getOpeningBalance } from '../lib/openingBalance'
import type { FixedCostCategory } from '../lib/budgetCategories'

export interface FixedCost {
  id: string
  name: string
  amount: number
  notes: string | null
  category: FixedCostCategory
}

export interface ReservedByCategory {
  spending: number
  investing: number
  giving: number
}

export interface BudgetSettings {
  income_override: number | null
  bills_pct: number
  spending_pct: number
  investing_pct: number
  giving_pct: number
}

const DEFAULT_SETTINGS: BudgetSettings = {
  income_override: null,
  bills_pct: 50,
  spending_pct: 20,
  investing_pct: 20,
  giving_pct: 10,
}

export function useBudzet() {
  const { user, carryOverEnabled, carryOverAffectsBudget, carryOverStartDate } = useAuth()
  const [settings, setSettings] = useState<BudgetSettings>(DEFAULT_SETTINGS)
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [transactionIncome, setTransactionIncome] = useState(0)
  const [openingBalance, setOpeningBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async (isCancelled: () => boolean = () => false): Promise<void> => {
    if (!user) return
    setLoading(true)
    setError(null)

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

    const [settingsRes, costsRes, incomeRes, opening] = await Promise.all([
      supabase.from('budget_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('fixed_costs').select('id, name, amount, notes, category').eq('user_id', user.id).order('created_at'),
      supabase.from('transactions').select('amount').eq('type', 'income').gte('date', startDate).lte('date', endDate),
      carryOverEnabled && carryOverAffectsBudget && carryOverStartDate
        ? getOpeningBalance(user.id, carryOverStartDate, startDate)
        : Promise.resolve(0),
    ])

    if (isCancelled()) return

    if (settingsRes.error || costsRes.error || incomeRes.error) {
      setError('Greška pri učitavanju budžeta.')
      setLoading(false)
      return
    }

    setSettings((settingsRes.data as BudgetSettings | null) ?? DEFAULT_SETTINGS)
    setFixedCosts((costsRes.data ?? []) as FixedCost[])
    setTransactionIncome((incomeRes.data ?? []).reduce((s, r) => s + r.amount, 0))
    setOpeningBalance(opening)
    setLoading(false)
  }, [user, carryOverEnabled, carryOverAffectsBudget, carryOverStartDate])

  useEffect(() => {
    let cancelled = false
    fetchAll(() => cancelled)
    return () => { cancelled = true }
  }, [fetchAll])

  const saveSettings = async (patch: Partial<BudgetSettings>): Promise<string | null> => {
    if (!user) return null
    const next = { ...settings, ...patch }
    setSettings(next)
    const { error: e } = await supabase.from('budget_settings').upsert({ user_id: user.id, ...next })
    return e ? 'Greška pri čuvanju budžeta.' : null
  }

  const addFixedCost = async (
    name: string, amount: number, notes: string | null, category: FixedCostCategory,
  ): Promise<string | null> => {
    if (!user) return null
    const { data, error: e } = await supabase
      .from('fixed_costs')
      .insert({ user_id: user.id, name, amount, notes, category })
      .select('id, name, amount, notes, category')
      .single()
    if (e) return 'Greška pri dodavanju troška.'
    if (data) setFixedCosts(prev => [...prev, data as FixedCost])
    return null
  }

  const updateFixedCost = async (
    id: string, name: string, amount: number, notes: string | null, category: FixedCostCategory,
  ): Promise<string | null> => {
    const { error: e } = await supabase
      .from('fixed_costs')
      .update({ name, amount, notes, category })
      .eq('id', id)
    if (e) return 'Greška pri izmjeni troška.'
    setFixedCosts(prev => prev.map(c => c.id === id ? { ...c, name, amount, notes, category } : c))
    return null
  }

  const deleteFixedCost = async (id: string): Promise<string | null> => {
    const { error: e } = await supabase.from('fixed_costs').delete().eq('id', id)
    if (e) return 'Greška pri brisanju troška.'
    setFixedCosts(prev => prev.filter(c => c.id !== id))
    return null
  }

  const baseIncome = settings.income_override ?? transactionIncome
  const monthlyIncome = baseIncome + openingBalance
  const totalFixedCosts = fixedCosts.reduce((s, c) => s + c.amount, 0)
  const billsCosts = fixedCosts.filter(c => c.category === 'bills').reduce((s, c) => s + c.amount, 0)
  const reservedByCategory: ReservedByCategory = {
    spending: fixedCosts.filter(c => c.category === 'spending').reduce((s, c) => s + c.amount, 0),
    investing: fixedCosts.filter(c => c.category === 'investing').reduce((s, c) => s + c.amount, 0),
    giving: fixedCosts.filter(c => c.category === 'giving').reduce((s, c) => s + c.amount, 0),
  }
  const remainingBudget = Math.max(0, monthlyIncome - billsCosts)

  return {
    settings,
    fixedCosts,
    monthlyIncome,
    transactionIncome,
    openingBalance,
    totalFixedCosts,
    billsCosts,
    reservedByCategory,
    remainingBudget,
    loading,
    error,
    saveSettings,
    addFixedCost,
    updateFixedCost,
    deleteFixedCost,
  }
}
