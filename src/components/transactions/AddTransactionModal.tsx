import { useState, useEffect, type FormEvent } from 'react'
import { X, ChevronDown, ChevronUp, Search } from 'lucide-react'

import { supabase } from '../../lib/supabase'
import { getLastUsedTransactionDate, setLastUsedTransactionDate } from '../../lib/lastUsedTransactionDate'
import { useAuth } from '../../hooks/useAuth'
import { useCategories } from '../../hooks/useCategories'
import { renderCategoryIcon } from '../../lib/renderCategoryIcon'
import { CalendarPicker } from '../CalendarPicker'

interface InitialData {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  category_id: string | null
  note: string | null
}

interface AddTransactionModalProps {
  onClose: () => void
  onAdded: () => void
  initialData?: InitialData
}

const today = new Date().toISOString().split('T')[0]

const inputClass = 'w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800/50 text-[#e1e2e7] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm'
const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5'

interface CategoryDropdownProps {
  categories: ReturnType<typeof useCategories>['categories']
  value: string
  onChange: (id: string) => void
}

function CategoryDropdown({ categories, value, onChange }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = categories.find(c => c.id === value)

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const filtered = search.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

  const showBezKategorije = !search.trim() || 'bez kategorije'.includes(search.toLowerCase())

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800/50 text-sm transition-all hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
      >
        <div className="flex items-center gap-2">
          {selected ? (
            <>
              <div
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                style={{ backgroundColor: (selected.color ?? '#64748b') + '33' }}
              >
                {renderCategoryIcon(selected.icon, 12, selected.color ?? '#64748b')}
              </div>
              <span className="text-[#e1e2e7]">{selected.name}</span>
            </>
          ) : (
            <span className="text-slate-500">Bez kategorije</span>
          )}
        </div>
        {open
          ? <ChevronUp size={15} className="text-slate-500 shrink-0" />
          : <ChevronDown size={15} className="text-slate-500 shrink-0" />
        }
      </button>

      {open && (
        <div className="mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          <div className="px-3 py-2 border-b border-slate-700">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-700/50 rounded-lg">
              <Search size={13} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pretraži kategorije..."
                className="flex-1 bg-transparent text-base sm:text-sm text-[#e1e2e7] placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {showBezKategorije && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-700 ${
                  !value ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400'
                }`}
              >
                Bez kategorije
              </button>
            )}
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-700 ${
                  value === c.id ? 'text-orange-400 bg-orange-500/10' : 'text-[#e1e2e7]'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: (c.color ?? '#64748b') + '33' }}
                >
                  {renderCategoryIcon(c.icon, 12, c.color ?? '#64748b')}
                </div>
                <span>{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && !showBezKategorije && (
              <p className="px-3 py-3 text-sm text-slate-500 text-center">Nema rezultata</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AddTransactionModal({ onClose, onAdded, initialData }: AddTransactionModalProps) {
  const { user, currency } = useAuth()
  const { categories } = useCategories()
  const isEdit = !!initialData

  const [type, setType] = useState<'income' | 'expense'>(initialData?.type ?? 'expense')
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? '')
  const [date, setDate] = useState(initialData?.date ?? getLastUsedTransactionDate() ?? today)
  const [note, setNote] = useState(initialData?.note ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredCategories = categories.filter(c => c.type === type)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Iznos mora biti broj veći od 0.')
      return
    }

    if (!categoryId) {
      setError('Odaberi kategoriju.')
      return
    }

    setLoading(true)

    const payload = {
      type,
      amount: parsedAmount,
      date,
      category_id: categoryId || null,
      note: note.trim() || null,
    }

    const { error: dbError } = isEdit
      ? await supabase.from('transactions').update(payload).eq('id', initialData!.id)
      : await supabase.from('transactions').insert({ ...payload, user_id: user!.id })

    if (dbError) {
      setError(isEdit ? 'Greška pri izmeni transakcije.' : 'Greška pri dodavanju transakcije.')
      setLoading(false)
      return
    }

    if (!isEdit) setLastUsedTransactionDate(date)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center md:pl-64">
      <div className="absolute inset-0 hidden md:block bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-md glass-card border border-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl h-[calc(100vh-4rem)] md:h-auto md:max-h-[90vh] mb-16 md:mb-0 flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <h2 className="font-display text-base font-semibold text-[#e1e2e7]">{isEdit ? 'Izmeni transakciju' : 'Nova transakcija'}</h2>
          <button
            onClick={onClose}
            aria-label="Zatvori"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form id="add-transaction-form" onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="flex rounded-xl bg-slate-800/50 p-1">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryId('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  type === t
                    ? t === 'expense'
                      ? 'bg-red-500/20 text-red-400 shadow-sm'
                      : 'bg-green-500/20 text-green-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'expense' ? 'Rashod' : 'Prihod'}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="amount" className={labelClass}>Iznos ({currency})</label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              required
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Kategorija</label>
            <CategoryDropdown
              categories={filteredCategories}
              value={categoryId}
              onChange={setCategoryId}
            />
            {filteredCategories.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Nema kategorija za ovaj tip. Dodaj ih u Podešavanjima.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Datum</label>
            <CalendarPicker value={date} onChange={setDate} />
          </div>

          <div>
            <label htmlFor="note" className={labelClass}>
              Beleška <span className="text-slate-500 font-normal">(opciono)</span>
            </label>
            <input
              id="note"
              type="text"
              placeholder="Kratka napomena..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">{error}</p>
          )}
        </form>

        <div className="px-5 py-4 border-t border-white/5 shrink-0">
          <button
            type="submit"
            form="add-transaction-form"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-[#2d1600] font-bold rounded-xl transition-all active:scale-95"
          >
            {loading ? (isEdit ? 'Čuvanje...' : 'Dodavanje...') : (isEdit ? 'Sačuvaj izmene' : 'Dodaj transakciju')}
          </button>
        </div>
      </div>
    </div>
  )
}
