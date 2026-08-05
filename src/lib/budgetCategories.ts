export type FixedCostCategory = 'bills' | 'spending' | 'investing' | 'giving'

export const FIXED_COST_CATEGORIES: FixedCostCategory[] = ['bills', 'spending', 'investing', 'giving']

export const CATEGORY_META: Record<FixedCostCategory, { label: string; color: string }> = {
  bills: { label: 'Računi', color: '#f97316' },
  spending: { label: 'Trošenje', color: '#3b82f6' },
  investing: { label: 'Investiranje', color: '#8b5cf6' },
  giving: { label: 'Davanje', color: '#ec4899' },
}
