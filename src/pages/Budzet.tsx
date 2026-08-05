import { useState, useEffect, type ChangeEvent } from 'react'
import { Pencil, Check, X, TrendingUp, Receipt } from 'lucide-react'

import { useBudzet, type BudgetSettings, type ReservedByCategory } from '../hooks/useBudzet'
import { FixedCostsModal } from '../components/budget/FixedCostsModal'
import { useAuth } from '../context/AuthContext'
import { formatAmount } from '../lib/formatAmount'

type SliderKey = 'spending_pct' | 'investing_pct' | 'giving_pct'
type CostKey = keyof ReservedByCategory

const SLIDER_CATEGORIES: { key: SliderKey; costKey: CostKey; label: string; sub: string; recommended: number }[] = [
  { key: 'spending_pct',  costKey: 'spending',  label: 'Trošenje',    sub: 'Hrana, zabava, hobiji, putovanja',        recommended: 20 },
  { key: 'investing_pct', costKey: 'investing', label: 'Investiranje', sub: 'Bitcoin, akcije, nekretnine',             recommended: 20 },
  { key: 'giving_pct',    costKey: 'giving',    label: 'Davanje',     sub: 'Donacije, pomoć porodici',                 recommended: 10 },
]

interface CardProps {
  label: string
  sub: string
  pct: number
  recommended: number
  remainingBudget: number
  reserved: number
  currency: string
  onChange: (v: number) => void
  onSave: () => void
}

function BudgetCard({ label, sub, pct, recommended, remainingBudget, reserved, currency, onChange, onSave }: CardProps) {
  const amount = Math.round((pct / 100) * remainingBudget)
  const free = amount - reserved
  const isOverReserved = reserved > amount

  return (
    <div className="bg-[#111418] rounded-xl p-6 border border-white/5 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-28 h-28 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="mb-6">
        <h3 className="text-base font-bold text-white">{label}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">TRENUTNO</p>
          <p className="text-2xl font-bold text-white">
            {pct}%{' '}
            <span className="text-xs text-slate-400 font-medium ml-1">({formatAmount(amount, currency)})</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-orange-500/80 uppercase font-bold tracking-widest mb-1">PREPORUČENO</p>
          <p className={`text-xl font-bold ${pct > recommended ? 'text-red-400' : 'text-orange-400'}`}>
            {recommended}%
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
          onMouseUp={onSave}
          onTouchEnd={onSave}
          className="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
          style={{ background: `linear-gradient(to right, #f97316 ${pct}%, rgba(255,255,255,0.05) ${pct}%)` }}
        />
        <div className="flex justify-between text-[10px] text-slate-600 font-bold">
          <span>0%</span>
          <span className="text-orange-500/50">{recommended}%</span>
          <span>100%</span>
        </div>
      </div>
      {reserved > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            Već rezervisano (fiksni troškovi)
          </span>
          <span className={`text-xs font-bold ${isOverReserved ? 'text-red-400' : 'text-slate-300'}`}>
            −{formatAmount(reserved, currency)}
          </span>
        </div>
      )}
      {reserved > 0 && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Slobodno</span>
          <span className={`text-xs font-bold ${isOverReserved ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatAmount(free, currency)}
          </span>
        </div>
      )}
    </div>
  )
}

interface BillsCardProps {
  billsCosts: number
  monthlyIncome: number
  currency: string
  onEdit: () => void
}

function BillsCard({ billsCosts, monthlyIncome, currency, onEdit }: BillsCardProps) {
  const pct = monthlyIncome > 0 ? Math.round((billsCosts / monthlyIncome) * 100) : 0
  const isOver = pct > 50

  return (
    <div className="bg-[#111418] rounded-xl p-6 border border-white/5 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-28 h-28 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="mb-6">
        <h3 className="text-base font-bold text-white">Računi</h3>
        <p className="text-xs text-slate-500 mt-0.5">Stanarina, struja, internet, osiguranje</p>
      </div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">FIKSNI TROŠKOVI</p>
          <p className="text-2xl font-bold text-white">
            {pct}%{' '}
            <span className="text-xs text-slate-400 font-medium ml-1">({formatAmount(Math.round(billsCosts), currency)})</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-orange-500/80 uppercase font-bold tracking-widest mb-1">PREPORUČENO</p>
          <p className={`text-xl font-bold ${isOver ? 'text-red-400' : 'text-orange-400'}`}>50%</p>
        </div>
      </div>
      <div className="space-y-2">
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 font-bold">
          <span>0%</span>
          <span className="text-orange-500/50">50%</span>
          <span>100%</span>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-orange-400 font-bold uppercase tracking-wider transition-colors"
      >
        <Receipt size={11} />
        Upravljaj fiksnim troškovima
      </button>
    </div>
  )
}

export function Budzet() {
  const { currency, carryOverAffectsBudget } = useAuth()
  const {
    settings, fixedCosts, monthlyIncome, transactionIncome, openingBalance,
    totalFixedCosts, billsCosts, reservedByCategory, remainingBudget,
    loading, error, saveSettings, addFixedCost, updateFixedCost, deleteFixedCost,
  } = useBudzet()

  const [showCostsModal, setShowCostsModal] = useState(false)
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sliders, setSliders] = useState<Pick<BudgetSettings, SliderKey>>({
    spending_pct: 20, investing_pct: 20, giving_pct: 10,
  })

  useEffect(() => {
    if (!loading) {
      setSliders({
        spending_pct: settings.spending_pct,
        investing_pct: settings.investing_pct,
        giving_pct: settings.giving_pct,
      })
    }
  }, [loading, settings])

  const handleSaveIncome = async (): Promise<void> => {
    setSaveError(null)
    const trimmed = incomeInput.trim()
    let err: string | null = null
    if (trimmed === '') {
      err = await saveSettings({ income_override: null })
    } else {
      const parsed = parseFloat(trimmed.replace(',', '.'))
      if (!isNaN(parsed) && parsed >= 0) {
        err = await saveSettings({ income_override: parsed })
      }
    }
    if (err) { setSaveError(err); return }
    setEditingIncome(false)
  }

  const handleSliderChange = (key: SliderKey, newValue: number): void => {
    const otherKeys = SLIDER_CATEGORIES.map(c => c.key).filter(k => k !== key)
    const othersSum = otherKeys.reduce((sum, k) => sum + sliders[k], 0)
    const clamped = Math.min(newValue, 100 - othersSum)
    setSliders(prev => ({ ...prev, [key]: clamped }))
  }

  const handleSliderSave = (): void => {
    void saveSettings({
      spending_pct: sliders.spending_pct,
      investing_pct: sliders.investing_pct,
      giving_pct: sliders.giving_pct,
    }).then(err => { if (err) setSaveError(err) })
  }

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div>
        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Planiranje finansija</p>
        <h1 className="text-3xl font-bold text-white mb-2">Budžet i Alokacija</h1>
        <p className="text-sm text-slate-400 max-w-xl">
          Primenite "Zlatna Pravila" investiranja i štednje. Prilagodite slajdere kako biste optimizovali raspodelu novca.
        </p>
      </div>

      <div className="p-5 bg-[#111418] border-l-4 border-orange-500 rounded-xl flex gap-4 items-start">
        <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Pravilo podele (50/20/20/10)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-orange-400 font-bold">50%</span> → računi i obaveze,{' '}
            <span className="text-orange-400 font-bold">20%</span> → trošenje,{' '}
            <span className="text-orange-400 font-bold">20%</span> → investiranje/štednja,{' '}
            <span className="text-orange-400 font-bold">10%</span> → davanje.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saveError && <p className="text-sm text-red-400">{saveError}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-[#111418] rounded-xl p-5 border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Ukupni mesečni prihod</p>
              {editingIncome ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={incomeInput}
                    onChange={e => setIncomeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') void handleSaveIncome() }}
                    className="flex-1 px-3 py-1.5 bg-white/5 border border-orange-500/50 rounded-lg text-white text-lg font-bold focus:outline-none"
                  />
                  <button onClick={() => void handleSaveIncome()} className="p-1.5 text-green-400 hover:text-green-300 transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingIncome(false)} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-orange-400">
                      {Math.round(monthlyIncome).toLocaleString('de-DE')}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">{currency}</span>
                    {settings.income_override !== null ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-500">Ručno • iz transakcija: {Math.round(transactionIncome).toLocaleString('de-DE')} {currency}</p>
                        <button
                          onClick={() => void saveSettings({ income_override: null })}
                          className="text-[10px] text-orange-500/70 hover:text-orange-400 font-bold transition-colors"
                        >
                          Resetuj
                        </button>
                      </div>
                    ) : transactionIncome === 0 ? (
                      <p className="text-[10px] text-slate-600 mt-0.5">Nema prihoda ovaj mesec — unesi ručno</p>
                    ) : (
                      <p className="text-[10px] text-slate-500 mt-0.5">Iz transakcija ovog meseca</p>
                    )}
                    {carryOverAffectsBudget && openingBalance !== 0 && (
                      <p className="text-[10px] text-orange-400/80 mt-0.5">
                        Uključuje preneseno: {openingBalance >= 0 ? '+' : ''}{formatAmount(openingBalance, currency)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setIncomeInput(settings.income_override !== null ? String(settings.income_override) : ''); setEditingIncome(true) }}
                    className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 transition-colors shrink-0"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#111418] rounded-xl p-5 border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Fiksni troškovi (obaveze)</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-white">
                    {Math.round(totalFixedCosts).toLocaleString('de-DE')}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">{currency}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {fixedCosts.length} {fixedCosts.length === 1 ? 'stavka' : 'stavki'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCostsModal(true)}
                  className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>

            <div className="bg-[#111418] rounded-xl p-5 border border-emerald-500/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Preostali budžet</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-emerald-400">
                    {Math.round(remainingBudget).toLocaleString('de-DE')}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">{currency}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Prihod − fiksni troškovi</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <TrendingUp size={14} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <BillsCard
              billsCosts={billsCosts}
              monthlyIncome={monthlyIncome}
              currency={currency}
              onEdit={() => setShowCostsModal(true)}
            />
            {SLIDER_CATEGORIES.map(cat => (
              <BudgetCard
                key={cat.key}
                label={cat.label}
                sub={cat.sub}
                pct={sliders[cat.key]}
                recommended={cat.recommended}
                remainingBudget={remainingBudget}
                reserved={reservedByCategory[cat.costKey]}
                currency={currency}
                onChange={v => handleSliderChange(cat.key, v)}
                onSave={handleSliderSave}
              />
            ))}
          </div>
        </>
      )}

      {showCostsModal && (
        <FixedCostsModal
          fixedCosts={fixedCosts}
          currency={currency}
          onAdd={addFixedCost}
          onUpdate={updateFixedCost}
          onDelete={deleteFixedCost}
          onClose={() => setShowCostsModal(false)}
        />
      )}
    </div>
  )
}
