export interface Transaction {
  id: string
  user_id: string
  date: string
  amount: number
  type: 'income' | 'expense'
  category_id: string | null
  note: string | null
  account_name: string | null
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: 'income' | 'expense'
  icon: string | null
  color: string | null
  sort_order: number
}

export interface BudgetRule {
  id: string
  user_id: string
  name: string
  percentage: number
  category_ids: string[]
}

export interface Settings {
  id: string
  theme: 'light' | 'dark'
  currency: string
  onboarding_completed: boolean
  carry_over_enabled: boolean
  carry_over_affects_budget: boolean
  carry_over_start_date: string | null
}
