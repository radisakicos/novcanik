import { useState, useRef, useEffect } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, ChevronDown, SlidersHorizontal, X } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useIzvestaji } from '../hooks/useIzvestaji'
import { useKategorijskiIzvestaj } from '../hooks/useKategorijskiIzvestaj'
import { renderCategoryIcon } from '../lib/renderCategoryIcon'
import { formatAmount } from '../lib/formatAmount'
import { CategoryPieChart } from '../components/reports/CategoryPieChart'
import { CalendarPicker } from '../components/CalendarPicker'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]
const TODAY_STR = new Date().toISOString().split('T')[0]

function YearPicker({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 bg-[#191c1f] border border-[#554335] text-white text-sm rounded-lg px-3 py-1.5 hover:border-orange-500/60 transition-colors"
      >
        {value}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[#191c1f] border border-[#554335] rounded-lg overflow-hidden z-20 shadow-xl">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => { onChange(y); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                y === value
                  ? 'text-orange-400 bg-orange-500/10'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const fmt = (d: string): string => {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}


interface PeriodFilterProps {
  activeFrom: string
  activeTo: string
  onApply: (from: string, to: string) => void
  onClear: () => void
}

function PeriodFilter({ activeFrom, activeTo, onApply, onClear }: PeriodFilterProps) {
  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(activeFrom)
  const [draftTo, setDraftTo] = useState(activeTo)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = !!activeFrom && !!activeTo
  const canApply = !!draftFrom && !!draftTo && draftFrom <= draftTo

  const handleOpen = (): void => {
    setDraftFrom(activeFrom || `${CURRENT_YEAR}-01-01`)
    setDraftTo(activeTo || TODAY_STR)
    setOpen(true)
  }

  const handleApply = (): void => {
    onApply(draftFrom, draftTo)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setDraftFrom('')
    setDraftTo('')
    onClear()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={isActive ? undefined : handleOpen}
        className={`flex items-center gap-2 text-sm rounded-lg px-2.5 py-1.5 border transition-colors ${
          isActive
            ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
            : 'bg-[#191c1f] border-[#554335] text-slate-300 hover:border-orange-500/60'
        }`}
      >
        <SlidersHorizontal size={14} className="shrink-0" />
        {isActive ? (
          <>
            <span onClick={handleOpen} className="cursor-pointer hidden sm:inline">{fmt(activeFrom)} – {fmt(activeTo)}</span>
            <X size={13} className="shrink-0 cursor-pointer hover:text-white" onClick={handleClear} />
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Ceo period</span>
            <ChevronDown size={13} className={`hidden sm:inline text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-[#191c1f] border border-[#554335] rounded-xl p-4 z-20 shadow-xl w-72">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Od</label>
              <CalendarPicker value={draftFrom} onChange={setDraftFrom} />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Do</label>
              <CalendarPicker value={draftTo} onChange={setDraftTo} />
            </div>
            <button
              onClick={handleApply}
              disabled={!canApply}
              className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-[#2d1600] font-bold text-sm rounded-lg transition-colors"
            >
              Primeni
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Izvestaji() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [activeFrom, setActiveFrom] = useState('')
  const [activeTo, setActiveTo] = useState('')
  const { currency } = useAuth()
  const { monthly, incomeByCategory, expenseByCategory, totalIncome, totalExpense, loading, error } = useIzvestaji(year)
  const filtered = useKategorijskiIzvestaj(activeFrom, activeTo)

  const monthlyWithSurplus = monthly.map(m => ({ ...m, surplus: Math.max(0, m.income - m.expense) }))

  const isFiltered = !!activeFrom && !!activeTo
  const displayIncome = isFiltered ? filtered.incomeByCategory : incomeByCategory
  const displayExpense = isFiltered ? filtered.expenseByCategory : expenseByCategory
  const displayTotalIncome = isFiltered ? filtered.totalIncome : totalIncome
  const displayTotalExpense = isFiltered ? filtered.totalExpense : totalExpense
  const cardsLoading = isFiltered ? filtered.loading : loading
  const emptyPeriodText = isFiltered ? 'izabrani period' : String(year)

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Godišnji izveštaji</h1>
        <YearPicker value={year} onChange={setYear} />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <section className="bg-[#111418] rounded-xl p-6 border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-base font-bold text-white">Mesečni prilivi i odlivi</h2>
              <div className="flex gap-5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Prihodi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rashodi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Višak</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyWithSurplus} barGap={3} barCategoryGap="32%">
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{
                    background: '#1a1f26',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e1dfd2',
                  }}
                  formatter={(value: number, name: string) => [
                    formatAmount(value, currency),
                    name === 'income' ? 'Prihodi' : name === 'expense' ? 'Rashodi' : 'Višak',
                  ]}
                />
                <Bar dataKey="income" fill="#f7931a" radius={[3, 3, 0, 0]} maxBarSize={12} />
                <Bar dataKey="expense" stackId="rashod" fill="#ef4444" radius={[0, 0, 0, 0]} maxBarSize={12} />
                <Bar dataKey="surplus" stackId="rashod" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Prihodi i rashodi po kategorijama</span>
              <PeriodFilter
                activeFrom={activeFrom}
                activeTo={activeTo}
                onApply={(f, t) => { setActiveFrom(f); setActiveTo(t) }}
                onClear={() => { setActiveFrom(''); setActiveTo('') }}
              />
            </div>
          {cardsLoading && isFiltered ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <section className="md:col-span-4 bg-[#111418] rounded-xl p-6 border border-white/5 flex flex-col">
              <h2 className="text-base font-bold text-white mb-6">Struktura prihoda</h2>
              <div className="space-y-5 flex-1">
                {displayIncome.length === 0 ? (
                  <p className="text-sm text-slate-600">Nema prihoda za {emptyPeriodText}.</p>
                ) : (
                  displayIncome.map(cat => (
                    <div key={cat.name}>
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs text-white font-semibold">{cat.name}</span>
                        <span className="text-xs text-orange-400">{cat.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <TrendingUp size={18} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Ukupan prihod</p>
                  <p className="text-base font-bold text-white">{formatAmount(displayTotalIncome, currency)}</p>
                </div>
              </div>
            </section>

            <section className="md:col-span-8 bg-[#111418] rounded-xl p-6 border border-white/5 flex flex-col">
              <h2 className="text-base font-bold text-white mb-6">Rashodi po kategorijama</h2>
              <div className="space-y-5 flex-1">
                {displayExpense.length === 0 ? (
                  <p className="text-sm text-slate-600">Nema rashoda za {emptyPeriodText}.</p>
                ) : (
                  displayExpense.map(cat => (
                    <div key={cat.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                            {renderCategoryIcon(cat.icon, 13) ?? <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                          </div>
                          <span className="text-xs text-white font-semibold">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 tabular-nums">{formatAmount(cat.total, currency)}</span>
                          <span className="text-xs text-red-400 font-bold w-9 text-right">{cat.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-8 pt-5 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ukupni rashodi</span>
                <span className="text-xl font-bold text-white">{formatAmount(displayTotalExpense, currency)}</span>
              </div>
            </section>
          </div>
          )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryPieChart
              title="Udeo prihoda"
              data={incomeByCategory}
              currency={currency}
              total={totalIncome}
              emptyText={`Nema prihoda za ${year}.`}
              type="income"
            />
            <CategoryPieChart
              title="Udeo odliva"
              data={expenseByCategory}
              currency={currency}
              total={totalExpense}
              emptyText={`Nema odliva za ${year}.`}
              type="expense"
            />
          </div>
        </>
      )}
    </div>
  )
}
