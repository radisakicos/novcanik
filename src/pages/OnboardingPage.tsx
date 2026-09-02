import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ChevronRight, ChevronLeft } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ColorPicker } from '../components/ColorPicker'
import { PRESET_COLORS } from '../lib/category.constants'
import { IconPicker } from '../components/IconPicker'
import { renderCategoryIcon } from '../lib/renderCategoryIcon'

interface CategoryDraft {
  localId: string
  name: string
  color: string
  icon: string
}

const DEFAULT_INCOME: Omit<CategoryDraft, 'localId'>[] = [
  { name: 'Plata', color: '#3b82f6', icon: 'Briefcase' },
  { name: 'Bonus', color: '#f59e0b', icon: 'TrendingUp' },
  { name: 'Poklon', color: '#ec4899', icon: 'Gift' },
]

const DEFAULT_EXPENSE: Omit<CategoryDraft, 'localId'>[] = [
  { name: 'Stanarina', color: '#8b5cf6', icon: 'Home' },
  { name: 'Računi', color: '#f97316', icon: 'Zap' },
  { name: 'Hrana', color: '#22c55e', icon: 'Utensils' },
  { name: 'Odmor', color: '#06b6d4', icon: 'Plane' },
  { name: 'Investiranje', color: '#3b82f6', icon: 'PiggyBank' },
  { name: 'Kupovina', color: '#f59e0b', icon: 'ShoppingCart' },
  { name: 'Zabava', color: '#ec4899', icon: 'Music' },
  { name: 'Zdravlje', color: '#ef4444', icon: 'Heart' },
  { name: 'Neočekivani troškovi', color: '#78716c', icon: 'Wrench' },
  { name: 'Davanje', color: '#10b981', icon: 'Users' },
]

let nextId = 0
const makeDrafts = (list: Omit<CategoryDraft, 'localId'>[]): CategoryDraft[] =>
  list.map(c => ({ ...c, localId: String(nextId++) }))

interface DraftItemProps {
  draft: CategoryDraft
  onChange: (updated: CategoryDraft) => void
  onDelete: () => void
}

function CategoryDraftItem({ draft, onChange, onDelete }: DraftItemProps) {
  const [showIcon, setShowIcon] = useState(false)
  const [showColor, setShowColor] = useState(false)

  const toggleIcon = () => { setShowIcon(v => !v); setShowColor(false) }
  const toggleColor = () => { setShowColor(v => !v); setShowIcon(false) }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleIcon}
          aria-label="Izaberi ikonicu"
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{ backgroundColor: draft.color + '33' }}
        >
          {renderCategoryIcon(draft.icon, 18, draft.color)}
        </button>

        <input
          type="text"
          value={draft.name}
          onChange={e => onChange({ ...draft, name: e.target.value })}
          className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-[#e1e2e7] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
        />

        <button
          type="button"
          onClick={toggleColor}
          aria-label="Izaberi boju"
          className="w-6 h-6 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-slate-900 ring-transparent hover:ring-white/30 transition-all"
          style={{ backgroundColor: draft.color }}
        />

        <button
          type="button"
          onClick={onDelete}
          aria-label="Ukloni kategoriju"
          className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {showIcon && (
        <div className="pl-12">
          <IconPicker value={draft.icon} onChange={icon => { onChange({ ...draft, icon }); setShowIcon(false) }} />
        </div>
      )}

      {showColor && (
        <div className="pl-12">
          <ColorPicker value={draft.color} onChange={color => { onChange({ ...draft, color }); setShowColor(false) }} />
        </div>
      )}
    </div>
  )
}

export function OnboardingPage() {
  const { user, setOnboardingCompleted } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)
  const [income, setIncome] = useState<CategoryDraft[]>(makeDrafts(DEFAULT_INCOME))
  const [expense, setExpense] = useState<CategoryDraft[]>(makeDrafts(DEFAULT_EXPENSE))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const drafts = step === 1 ? income : expense
  const setDrafts = step === 1 ? setIncome : setExpense

  const addNew = () => {
    const newDraft: CategoryDraft = {
      localId: String(nextId++),
      name: '',
      color: PRESET_COLORS[0],
      icon: 'Wallet',
    }
    setDrafts(prev => [...prev, newDraft])
  }

  const updateDraft = (localId: string, updated: CategoryDraft) =>
    setDrafts(prev => prev.map(d => d.localId === localId ? updated : d))

  const deleteDraft = (localId: string) =>
    setDrafts(prev => prev.filter(d => d.localId !== localId))

  const handleFinish = async () => {
    setSaving(true)
    setError(null)

    const allCategories = [
      ...income.filter(d => d.name.trim()).map(d => ({
        user_id: user!.id, name: d.name.trim(), type: 'income' as const, color: d.color, icon: d.icon,
      })),
      ...expense.filter(d => d.name.trim()).map(d => ({
        user_id: user!.id, name: d.name.trim(), type: 'expense' as const, color: d.color, icon: d.icon,
      })),
    ]

    if (allCategories.length > 0) {
      const { error: insertError } = await supabase.from('categories').insert(allCategories)
      if (insertError) {
        setError('Greška pri čuvanju kategorija. Pokušaj ponovo.')
        setSaving(false)
        return
      }
    }

    await supabase.from('settings').update({ onboarding_completed: true }).eq('id', user!.id)
    setOnboardingCompleted(true)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#111417] flex items-center justify-center p-4">
      <div className="centered-hero-gradient fixed inset-0 pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center mb-6">
          <span className="font-display text-2xl font-black tracking-tighter text-orange-500 mb-1">Novčanik</span>
          <div className="flex items-center gap-2 mt-2">
            <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 1 ? 'bg-orange-500' : 'bg-slate-700'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 2 ? 'bg-orange-500' : 'bg-slate-700'}`} />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-orange-500/10 p-6 space-y-4">
          <div>
            <h1 className="font-display text-lg font-semibold text-[#e1e2e7]">
              {step === 1 ? 'Kategorije prihoda' : 'Kategorije rashoda'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Izmeni naziv, ikonicu ili boju, ili dodaj svoje.
            </p>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {drafts.map(draft => (
              <CategoryDraftItem
                key={draft.localId}
                draft={draft}
                onChange={updated => updateDraft(draft.localId, updated)}
                onDelete={() => deleteDraft(draft.localId)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addNew}
            className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium"
          >
            <Plus size={16} />
            Dodaj kategoriju
          </button>

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={16} />
                Nazad
              </button>
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-[#2d1600] font-bold rounded-xl text-sm transition-all active:scale-95"
              >
                Dalje
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-[#2d1600] font-bold rounded-xl text-sm transition-all active:scale-95"
              >
                {saving ? 'Čuvanje...' : 'Završi podešavanje'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
