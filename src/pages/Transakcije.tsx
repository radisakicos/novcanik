import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useTransactions, type TransactionWithCategory } from '../hooks/useTransactions'
import { AddTransactionModal } from '../components/transactions/AddTransactionModal'
import { formatAmount } from '../lib/formatAmount'

const MONTHS_SR = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec']
const PAGE_SIZES = [10, 20, 50] as const
const STORAGE_KEY = 'novcanik-page-size'

function readPageSize(): number {
  const stored = localStorage.getItem(STORAGE_KEY)
  const n = Number(stored)
  return PAGE_SIZES.includes(n as typeof PAGE_SIZES[number]) ? n : 10
}

type Filter = 'all' | 'income' | 'expense'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export function Transakcije() {
  const now = new Date()
  const { currency } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(readPageSize)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const isCurrentMonth = year === now.getFullYear() && currentDate.getMonth() === now.getMonth()

  const { transactions, loading, error, refetch } = useTransactions(year, month)

  const prevMonth = (): void => { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); setPage(1) }
  const nextMonth = (): void => { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); setPage(1) }

  const handleDelete = async (id: string): Promise<void> => {
    setConfirmDeleteId(null)
    setDeletingId(id)
    await supabase.from('transactions').delete().eq('id', id)
    await refetch()
    setDeletingId(null)
  }

  const filtered = useMemo(() => {
    if (filter === 'income') return transactions.filter(t => t.type === 'income')
    if (filter === 'expense') return transactions.filter(t => t.type === 'expense')
    return transactions
  }, [transactions, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handlePageSizeChange = (size: number): void => {
    localStorage.setItem(STORAGE_KEY, String(size))
    setPageSize(size)
    setPage(1)
  }

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions])
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions])

  const handleFilterChange = (f: Filter): void => { setFilter(f); setPage(1) }


  const renderActions = (t: TransactionWithCategory) => confirmDeleteId === t.id ? (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-slate-400 whitespace-nowrap">Obrisati?</span>
      <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="px-2 py-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50">Da</button>
      <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-[10px] font-bold text-slate-400 bg-white/5 hover:bg-white/10 rounded-md transition-colors">Ne</button>
    </div>
  ) : (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
      <button onClick={() => setEditingTransaction(t)} aria-label="Izmeni" className="p-1.5 text-slate-600 hover:text-orange-400 transition-colors rounded-lg hover:bg-orange-500/10"><Pencil size={13} /></button>
      <button onClick={() => setConfirmDeleteId(t.id)} disabled={deletingId === t.id} aria-label="Obriši" className="p-1.5 text-slate-600 hover:text-red-400 disabled:opacity-50 transition-colors rounded-lg hover:bg-red-500/10"><Trash2 size={13} /></button>
    </div>
  )

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={prevMonth} aria-label="Prethodni mesec" className="p-1 rounded-lg hover:bg-white/5 transition-colors">
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
            <h1 className="text-2xl font-bold text-white">{MONTHS_SR[currentDate.getMonth()]} {year}</h1>
            <button onClick={nextMonth} disabled={isCurrentMonth} aria-label="Sledeći mesec" className="p-1 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-slate-500">Pregled svih vaših finansijskih aktivnosti.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter pills */}
          <div className="flex bg-white/5 p-1 rounded-full">
            {(['all', 'income', 'expense'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? 'Sve' : f === 'income' ? 'Prihodi' : 'Rashodi'}
              </button>
            ))}
          </div>
          {/* Desktop add button */}
          <button
            onClick={() => setShowModal(true)}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-full transition-colors"
          >
            <Plus size={15} />
            Dodaj
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {/* Table card */}
      <div className="bg-[#111418] rounded-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-600 mb-2">Nema transakcija.</p>
            <button onClick={() => setShowModal(true)} className="text-sm text-orange-400 hover:underline">
              Dodaj prvu →
            </button>
          </div>
        ) : (
          <>
            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-36">Datum</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opis</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-36">Kategorija</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-16 text-center">Tip</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-40 text-right">Iznos</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginated.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-4 px-6">
                        {t.note ? <span className="text-sm font-medium text-white line-clamp-2">{t.note}</span>
                          : <span className="text-sm italic text-slate-600">Bez opisa</span>}
                      </td>
                      <td className="py-4 px-6">
                        {t.category_name && (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.type === 'income' ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
                            {t.category_name}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {t.type === 'income' ? <ArrowUpRight size={18} className="text-orange-400 inline" /> : <ArrowDownRight size={18} className="text-red-400 inline" />}
                      </td>
                      <td className={`py-4 px-6 text-right text-sm font-bold tabular-nums ${t.type === 'income' ? 'text-orange-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, currency)}
                      </td>
                      <td className="py-4 pr-4">{renderActions(t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card lista */}
            <div className="md:hidden divide-y divide-white/5">
              {paginated.map(t => (
                <div key={t.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-orange-500/15' : 'bg-red-500/15'}`}>
                    {t.type === 'income'
                      ? <ArrowUpRight size={15} className="text-orange-400" />
                      : <ArrowDownRight size={15} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {t.note
                      ? <p className="text-sm font-medium text-white truncate">{t.note}</p>
                      : <p className="text-sm italic text-slate-600">Bez opisa</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.category_name && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${t.type === 'income' ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
                          {t.category_name}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">{formatDate(t.date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-sm font-bold tabular-nums ${t.type === 'income' ? 'text-orange-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, currency)}
                    </span>
                    {confirmDeleteId === t.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400">Obrisati?</span>
                        <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-red-500 rounded transition-colors disabled:opacity-50">Da</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-white/5 rounded transition-colors">Ne</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingTransaction(t)} aria-label="Izmeni" className="p-1 text-slate-500 hover:text-orange-400 rounded transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(t.id)} aria-label="Obriši" className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-4 py-4 border-t border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/5">
                  {PAGE_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => handlePageSizeChange(size)}
                      className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        pageSize === size
                          ? 'bg-orange-500 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Prikazano {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} od {filtered.length}
                </p>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-all">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${p === page ? 'bg-orange-500 text-white' : 'border border-white/10 text-slate-400 hover:bg-white/5'}`}>{p}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[#111418] rounded-xl p-6 border border-white/5 flex flex-col justify-between min-h-36">
          <div>
            <TrendingUp size={20} className="text-orange-400 mb-3" />
            <p className="text-sm font-semibold text-white">Ukupan prihod</p>
            <p className="text-xs text-slate-500 mt-0.5">Ovaj mesec</p>
          </div>
          <p className="text-3xl font-bold text-orange-400 mt-4">+{formatAmount(totalIncome, currency)}</p>
        </div>
        <div className="bg-[#111418] rounded-xl p-6 border border-white/5 flex flex-col justify-between min-h-36">
          <div>
            <TrendingDown size={20} className="text-red-400 mb-3" />
            <p className="text-sm font-semibold text-white">Ukupan rashod</p>
            <p className="text-xs text-slate-500 mt-0.5">Ovaj mesec</p>
          </div>
          <p className="text-3xl font-bold text-red-400 mt-4">-{formatAmount(totalExpense, currency)}</p>
        </div>
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => setShowModal(true)}
        aria-label="Dodaj transakciju"
        className="fixed bottom-20 right-4 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center md:hidden z-40 transition-colors"
      >
        <Plus size={24} />
      </button>

      {showModal && (
        <AddTransactionModal onClose={() => setShowModal(false)} onAdded={refetch} />
      )}

      {editingTransaction && (
        <AddTransactionModal
          onClose={() => setEditingTransaction(null)}
          onAdded={refetch}
          initialData={{
            id: editingTransaction.id,
            type: editingTransaction.type,
            amount: editingTransaction.amount,
            date: editingTransaction.date,
            category_id: editingTransaction.category_id,
            note: editingTransaction.note,
          }}
        />
      )}
    </div>
  )
}
