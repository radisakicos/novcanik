import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'

import { useDashboard } from '../hooks/useDashboard'
import { AddTransactionModal } from '../components/transactions/AddTransactionModal'
import { useAuth } from '../hooks/useAuth'
import { formatAmount } from '../lib/formatAmount'
import { renderCategoryIcon } from '../lib/renderCategoryIcon'

const MONTHS_SR = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar',
]

const MONTHS_SR_GEN = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}. ${MONTHS_SR_GEN[d.getMonth()]}`
}

export function Dashboard() {
  const now = new Date()
  const { currency, carryOverEnabled } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [showModal, setShowModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const isCurrentMonth = year === now.getFullYear() && currentDate.getMonth() === now.getMonth()

  const { totalIncome, totalExpense, openingBalance, balance, recentTransactions, loading, error } =
    useDashboard(year, month, refreshKey)

  const monthDelta = totalIncome - totalExpense

  const prevMonth = (): void => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = (): void => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const maxAmount = Math.max(totalIncome, totalExpense, 1)
  const incomeProgress = Math.round((totalIncome / maxAmount) * 100)
  const expenseProgress = Math.round((totalExpense / maxAmount) * 100)

  const monthLabel = `${MONTHS_SR[currentDate.getMonth()]} ${year}`

  return (
    <div className="space-y-5">

      {error && (
        <p role="alert" className="text-sm text-red-400 px-1">{error}</p>
      )}

      {/* Hero balance card */}
      <section className="relative">
        <div className="centered-hero-gradient absolute inset-0 -z-10 rounded-[2rem]" />
        <div className="glass-card rounded-[2rem] p-8 md:p-14 border border-orange-500/20 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

          <div className="flex items-center gap-3 mb-5">
            <button onClick={prevMonth} aria-label="Prethodni mesec"
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft size={16} className="text-orange-500/60" />
            </button>
            <div className="text-center">
              <p className="text-orange-500/80 text-xs font-bold uppercase tracking-[0.3em]">
                {monthLabel}
              </p>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-0.5">Balans</p>
            </div>
            <button onClick={nextMonth} disabled={isCurrentMonth} aria-label="Sledeći mesec"
              className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={16} className="text-orange-500/60" />
            </button>
          </div>

          <div className="flex items-baseline justify-center gap-3 mb-3">
            <h1 className="font-display text-white text-6xl md:text-7xl font-bold" style={{ letterSpacing: '-0.02em' }}>
              {loading ? '—' : Math.round(balance).toLocaleString('de-DE')}
            </h1>
            <span className="font-display text-orange-500/60 text-2xl font-semibold">
              {currency}
            </span>
          </div>

          {!loading && carryOverEnabled && (
            <p className="text-xs text-slate-500 mb-8">
              Preneseno: <span className={openingBalance >= 0 ? 'text-green-400' : 'text-red-400'}>
                {openingBalance >= 0 ? '+' : ''}{formatAmount(openingBalance, currency)}
              </span>
              {' · '}Ovaj mesec: <span className={monthDelta >= 0 ? 'text-green-400' : 'text-red-400'}>
                {monthDelta >= 0 ? '+' : ''}{formatAmount(monthDelta, currency)}
              </span>
            </p>
          )}
          {(loading || !carryOverEnabled) && <div className="mb-8" />}

          <button onClick={() => setShowModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-[#2d1600] font-bold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-95 flex items-center gap-2">
            <Plus size={16} />
            Dodaj transakciju
          </button>
        </div>
      </section>

      {/* Income + Expense cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6 hover:border-green-500/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <ArrowDownLeft size={22} className="text-green-500" />
            </div>
            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded">PRIHODI</span>
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">Ukupni prihodi</p>
          <p className="font-display text-[#e1e2e7] text-2xl font-semibold">
            {loading ? '—' : formatAmount(totalIncome, currency)}
          </p>
          <div className="mt-4 h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${loading ? 0 : incomeProgress}%`, boxShadow: '0 0 8px rgba(34,197,94,0.4)' }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover:border-red-500/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={22} className="text-red-500" />
            </div>
            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded">RASHODI</span>
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">Ukupni rashodi</p>
          <p className="font-display text-[#e1e2e7] text-2xl font-semibold">
            {loading ? '—' : formatAmount(totalExpense, currency)}
          </p>
          <div className="mt-4 h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all duration-700"
              style={{ width: `${loading ? 0 : expenseProgress}%`, boxShadow: '0 0 8px rgba(239,68,68,0.4)' }} />
          </div>
        </div>
      </section>

      {/* Recent transactions */}
      <section className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="font-display text-lg font-semibold text-[#e1e2e7]">Poslednje transakcije</h2>
          <Link to="/transakcije" className="text-orange-500 text-sm font-bold hover:underline">Vidi sve</Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Učitavanje...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
              <Receipt size={36} className="text-slate-600" />
            </div>
            <h3 className="font-display text-[#e1e2e7] text-lg font-semibold mb-2">Nema transakcija za ovaj mesec</h3>
            <p className="text-slate-400 text-center text-sm max-w-xs">
              Još niste dodali nijednu transakciju. Počnite da pratite svoje finansije odmah.
            </p>
          </div>
        ) : (
          <ul>
            {recentTransactions.map((t, i) => (
              <li key={t.id}
                className={`flex items-center justify-between px-6 py-4 ${i < recentTransactions.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (t.category_color ?? (t.type === 'income' ? '#10b981' : '#ef4444')) + '26' }}
                  >
                    {t.category_icon
                      ? renderCategoryIcon(t.category_icon, 18, t.category_color ?? (t.type === 'income' ? '#10b981' : '#ef4444'))
                      : <span className="text-white text-xs font-bold">
                          {(t.category_name ?? (t.type === 'income' ? 'P' : 'R'))[0].toUpperCase()}
                        </span>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e1e2e7]">
                      {t.category_name ?? (t.type === 'income' ? 'Prihod' : 'Rashod')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(t.date)}{t.account_name ? ` · ${t.account_name}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '−'}{formatAmount(t.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showModal && (
        <AddTransactionModal onClose={() => setShowModal(false)} onAdded={() => setRefreshKey(k => k + 1)} />
      )}
    </div>
  )
}
