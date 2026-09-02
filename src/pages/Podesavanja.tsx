import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, GripVertical, Check, ChevronDown, ChevronUp, Lock, Mail, Coins, TrendingDown, TrendingUp, Smartphone, Share, Code2, Github, Zap, CircleDollarSign, Eye, EyeOff, ArrowRightLeft } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { ColorPicker } from '../components/ColorPicker'
import { PRESET_COLORS } from '../lib/category.constants'
import { IconPicker } from '../components/IconPicker'
import { renderCategoryIcon } from '../lib/renderCategoryIcon'
import { Switch } from '../components/Switch'
import type { Category } from '../types'

const CURRENCIES = [
  { value: 'RSD', label: 'Srpski dinar', symbol: 'RSD' },
  { value: '€', label: 'Euro', symbol: '€' },
  { value: '$', label: 'Američki dolar', symbol: '$' },
]

const SUPPORT_EMAIL = 'algo_founder@proton.me'

function getInitials(fullName: string | null, email: string | null): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

// ---- Change Password Modal ----

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const inputCls = 'w-full pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-[#e1e2e7] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm'
  const eyeBtn = 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors'

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) { setError('Nova lozinka mora imati najmanje 8 karaktera.'); return }
    if (newPassword !== confirmPassword) { setError('Lozinke se ne poklapaju.'); return }
    setLoading(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: oldPassword,
    })
    if (authErr) { setError('Stara lozinka nije ispravna.'); setLoading(false); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    if (updateErr) { setError('Greška pri promeni lozinke.'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111418] border border-white/10 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#e1e2e7]">Promeni lozinku</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check size={22} className="text-green-400" />
            </div>
            <p className="text-sm text-[#e1e2e7] font-semibold">Lozinka uspešno promenjena</p>
            <button onClick={onClose} className="w-full mt-2 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-[#2d1600] font-bold text-sm transition-all">
              Zatvori
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stara lozinka</label>
              <div className="relative">
                <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
                <button type="button" onClick={() => setShowOld(v => !v)} className={eyeBtn}>{showOld ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nova lozinka</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
                <button type="button" onClick={() => setShowNew(v => !v)} className={eyeBtn}>{showNew ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Potvrdi novu lozinku</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className={eyeBtn}>{showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-all">Otkaži</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-[#2d1600] font-bold text-sm transition-all">
                {loading ? 'Čuvanje...' : 'Sačuvaj'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}


// ---- Category form modal ----

interface CategoryFormModalProps {
  category: Category | null
  type: 'income' | 'expense'
  onClose: () => void
  onSaved: () => void
}

function CategoryFormModal({ category, type, onClose, onSaved }: CategoryFormModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? PRESET_COLORS[0])
  const [icon, setIcon] = useState(category?.icon ?? 'Wallet')
  const [showIcon, setShowIcon] = useState(false)
  const [showColor, setShowColor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    if (category) {
      const { error: err } = await supabase.from('categories').update({ name: name.trim(), color, icon }).eq('id', category.id)
      if (err) { setError('Greška pri čuvanju.'); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('categories').insert({ user_id: user!.id, name: name.trim(), type, color, icon })
      if (err) { setError('Greška pri čuvanju.'); setLoading(false); return }
    }
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-sm glass-card border border-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl p-5 pb-24 md:pb-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[#e1e2e7]">{category ? 'Izmeni kategoriju' : 'Nova kategorija'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setShowIcon(v => !v); setShowColor(false) }}
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '33' }}>
              {renderCategoryIcon(icon, 22, color)}
            </button>
            <div className="flex-1">
              <label htmlFor="cat-name" className="block text-sm font-medium text-slate-300 mb-1.5">Naziv</label>
              <input id="cat-name" type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Naziv kategorije"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-[#e1e2e7] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all" />
            </div>
            <button type="button" onClick={() => { setShowColor(v => !v); setShowIcon(false) }}
              className="w-7 h-7 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-slate-900 ring-transparent hover:ring-white/30 transition-all"
              style={{ backgroundColor: color }} />
          </div>
          {showIcon && <IconPicker value={icon} onChange={i => { setIcon(i); setShowIcon(false) }} />}
          {showColor && <ColorPicker value={color} onChange={c => { setColor(c); setShowColor(false) }} />}
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading || !name.trim()}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-[#2d1600] font-bold rounded-xl text-sm transition-all active:scale-95">
            {loading ? 'Čuvanje...' : 'Sačuvaj'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---- Delete confirmation modal ----

interface DeleteModalProps { category: Category; txCount: number; onClose: () => void; onConfirm: () => void; onRename: () => void }

function DeleteModal({ category, txCount, onClose, onConfirm, onRename }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-card border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-[#e1e2e7]">Obriši kategoriju</h2>
        <p className="text-sm text-slate-400">
          {txCount > 0
            ? `Kategorija "${category.name}" je korišćena u ${txCount} ${txCount === 1 ? 'transakciji' : 'transakcija'}. Te transakcije ostaju bez kategorije.`
            : `Obrisaćeš kategoriju "${category.name}".`}
        </p>
        {txCount > 0 && <p className="text-sm text-orange-400/80">Možeš je i preimenovati umesto brisanja.</p>}
        <div className="flex gap-2 pt-1">
          {txCount > 0 && (
            <button type="button" onClick={onRename} className="flex-1 py-2.5 border border-slate-600 hover:border-orange-500/50 text-slate-300 hover:text-orange-400 font-medium rounded-xl text-sm transition-colors">Preimenuj</button>
          )}
          <button type="button" disabled={deleting} onClick={async () => { setDeleting(true); await onConfirm() }}
            className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl text-sm transition-colors disabled:opacity-60">
            {deleting ? 'Brisanje...' : 'Ipak obriši'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Sortable category row ----

function SortableCategoryRow({ category, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 transition-all group">
      <button type="button" {...attributes} {...listeners} aria-label="Prevuci"
        className="p-0.5 text-slate-700 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none">
        <GripVertical size={14} />
      </button>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (category.color ?? '#64748b') + '22' }}>
        {renderCategoryIcon(category.icon, 15, category.color ?? '#64748b')}
      </div>
      <span className="flex-1 text-sm font-medium text-slate-200">{category.name}</span>
      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={onEdit} className="p-1.5 text-slate-500 hover:text-white transition-colors"><Pencil size={14} /></button>
        <button type="button" onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
      </div>
    </li>
  )
}

// ---- Main page ----

export function Podesavanja() {
  const {
    user, currency, setCurrency, fullName, setFullName,
    carryOverEnabled, setCarryOverEnabled,
    carryOverAffectsBudget, setCarryOverAffectsBudget,
    carryOverStartDate, setCarryOverStartDate,
  } = useAuth()
  const { categories, loading, error: categoriesError, refetch } = useCategories()
  const { canInstall, isIOS, isInstalled, install } = usePWAInstall()

  const [addModalType, setAddModalType] = useState<'income' | 'expense' | null>(null)
  const [savingCurrency, setSavingCurrency] = useState(false)
  const [savingCarryOver, setSavingCarryOver] = useState(false)
  const [carryOverError, setCarryOverError] = useState<string | null>(null)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [txCount, setTxCount] = useState(0)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emailConfirmMsg, setEmailConfirmMsg] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [showQR, setShowQR] = useState<'lightning' | 'usdt' | null>(null)

  const initials = getInitials(fullName, user?.email ?? null)
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const handleSaveProfile = async (): Promise<void> => {
    setSavingName(true)
    if (nameInput.trim()) {
      await supabase.from('settings').update({ full_name: nameInput.trim() }).eq('id', user!.id)
      setFullName(nameInput.trim())
    }
    const trimmedEmail = emailInput.trim()
    if (trimmedEmail && trimmedEmail !== user?.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email: trimmedEmail })
      if (!emailErr) setEmailConfirmMsg('Poslat je email na novu adresu. Klikni link u emailu da potvrdiš promenu.')
    }
    setSavingName(false)
    setEditingName(false)
  }

  const handleCurrencyChange = async (value: string): Promise<void> => {
    if (value === currency || savingCurrency) return
    setSavingCurrency(true)
    setCurrency(value)
    await supabase.from('settings').update({ currency: value }).eq('id', user!.id)
    setSavingCurrency(false)
  }

  const handleCarryOverToggle = async (enabled: boolean): Promise<void> => {
    setSavingCarryOver(true)
    setCarryOverError(null)
    const now = new Date()
    // Local parts, not toISOString(): UTC would roll an activation made just after
    // midnight on the 1st back into the previous month. The day is fixed to 01 —
    // carry-over is month-granular, see toMonthStart().
    const startDate = enabled
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      : carryOverStartDate
    const previous = { enabled: carryOverEnabled, startDate: carryOverStartDate, affectsBudget: carryOverAffectsBudget }

    setCarryOverEnabled(enabled)
    setCarryOverStartDate(startDate)
    if (!enabled) setCarryOverAffectsBudget(false)

    const { error: saveError } = await supabase.from('settings').update({
      carry_over_enabled: enabled,
      carry_over_start_date: startDate,
      ...(enabled ? {} : { carry_over_affects_budget: false }),
    }).eq('id', user!.id)

    // Roll the optimistic update back: leaving it in place shows the switch as
    // saved while the next page load silently reverts it.
    if (saveError) {
      setCarryOverEnabled(previous.enabled)
      setCarryOverStartDate(previous.startDate)
      setCarryOverAffectsBudget(previous.affectsBudget)
      setCarryOverError('Greška pri čuvanju podešavanja.')
    }
    setSavingCarryOver(false)
  }

  const handleCarryOverBudgetToggle = async (enabled: boolean): Promise<void> => {
    setSavingCarryOver(true)
    setCarryOverError(null)
    const previous = carryOverAffectsBudget
    setCarryOverAffectsBudget(enabled)

    const { error: saveError } = await supabase
      .from('settings')
      .update({ carry_over_affects_budget: enabled })
      .eq('id', user!.id)

    if (saveError) {
      setCarryOverAffectsBudget(previous)
      setCarryOverError('Greška pri čuvanju podešavanja.')
    }
    setSavingCarryOver(false)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const makeDragEnd = (list: Category[]) => async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = list.findIndex(c => c.id === active.id)
    const newIndex = list.findIndex(c => c.id === over.id)
    await Promise.all(arrayMove(list, oldIndex, newIndex).map((cat, i) =>
      supabase.from('categories').update({ sort_order: i }).eq('id', cat.id)
    ))
    refetch()
  }

  const handleDeleteClick = async (cat: Category): Promise<void> => {
    const { count } = await supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('category_id', cat.id)
    setTxCount(count ?? 0)
    setDeletingCategory(cat)
  }

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deletingCategory) return
    await supabase.from('categories').delete().eq('id', deletingCategory.id)
    setDeletingCategory(null)
    refetch()
  }

  const sectionLabel = 'text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4'
  const card = 'bg-[#111418] rounded-2xl border border-white/5'

  return (
    <div className="space-y-8 pb-24 md:pb-8">

      {/* MOJ PROFIL */}
      <section>
        <p className={sectionLabel}>Moj profil</p>
        <div className={`${card} p-6`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shrink-0">
              <span className="text-lg font-black text-[#2d1600]">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="space-y-2">
                  <input
                    autoFocus type="text" value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') void handleSaveProfile() }}
                    placeholder="Ime i prezime"
                    className="w-full px-3 py-1.5 bg-white/5 border border-orange-500/50 rounded-lg text-white text-sm font-bold focus:outline-none"
                  />
                  <input
                    type="email" value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') void handleSaveProfile() }}
                    placeholder="Email adresa"
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50"
                  />
                  <div className="flex gap-2 pt-0.5">
                    <button onClick={() => void handleSaveProfile()} disabled={savingName} className="p-1.5 text-green-400 hover:text-green-300 transition-colors"><Check size={15} /></button>
                    <button onClick={() => setEditingName(false)} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"><X size={15} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base font-bold text-white truncate">{fullName ?? 'Dodaj ime i prezime'}</p>
                  <p className="text-sm text-slate-400 mt-0.5 truncate">{user?.email}</p>
                  {emailConfirmMsg && <p className="text-xs text-orange-400 mt-1">{emailConfirmMsg}</p>}
                </>
              )}
            </div>
            {!editingName && (
              <button
                onClick={() => { setNameInput(fullName ?? ''); setEmailInput(user?.email ?? ''); setEmailConfirmMsg(null); setEditingName(true) }}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-all shrink-0"
              >
                <Pencil size={14} />
                <span className="hidden sm:inline">Izmeni</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* BEZBEDNOST + LOKALIZACIJA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <section className="flex flex-col">
          <p className={sectionLabel}>Bezbednost</p>
          <div className={`${card} p-6 flex flex-col flex-1 justify-center`}>
            <button onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                  <Lock size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Promeni lozinku</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Klikni da promeniš</p>
                </div>
              </div>
              <ChevronDown size={16} className="text-slate-600 group-hover:text-slate-400 -rotate-90 transition-colors" />
            </button>
          </div>
        </section>

        <section className="flex flex-col">
          <p className={sectionLabel}>Lokalizacija</p>
          <div className={`${card} p-6 flex flex-col flex-1 justify-between`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-white mb-1">Izaberi valutu</p>
                <p className="text-xs text-slate-400 leading-relaxed">Utiče na sve preglede i grafikone.</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                <Coins size={16} />
              </div>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setCurrencyOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-sm transition-all hover:border-white/20 focus:outline-none">
                <span className="text-white font-semibold">{currency} — {CURRENCIES.find(c => c.value === currency)?.label}</span>
                {currencyOpen ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
              </button>
              {currencyOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#191c1f] border border-white/10 rounded-xl overflow-hidden shadow-xl z-10">
                  {CURRENCIES.map(c => (
                    <button key={c.value} type="button" disabled={savingCurrency}
                      onClick={() => { void handleCurrencyChange(c.value); setCurrencyOpen(false) }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-white/5 ${currency === c.value ? 'text-orange-400' : 'text-[#e1e2e7]'}`}>
                      <span>{c.symbol} — {c.label}</span>
                      {currency === c.value && <Check size={14} className="text-orange-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* PRENOS SALDA */}
      <section>
        <p className={sectionLabel}>Prenos salda</p>
        <div className={`${card} p-6`}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                <ArrowRightLeft size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Prenesi ostatak u sledeći mesec</p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-md">
                  Kad je uključeno, ono što ti ostane (ili si u minusu) na kraju meseca automatski
                  se dodaje na balans sledećeg meseca. Računa se od meseca u kom ovo uključiš —
                  raniji meseci se ne diraju.
                </p>
              </div>
            </div>
            <Switch checked={carryOverEnabled} disabled={savingCarryOver}
              onChange={v => void handleCarryOverToggle(v)} label="Prenesi ostatak u sledeći mesec" />
          </div>

          <div className={`flex items-start justify-between gap-4 pt-5 border-t border-white/5 transition-opacity ${carryOverEnabled ? 'opacity-100' : 'opacity-40'}`}>
            <div>
              <p className="text-sm font-bold text-white">Primeni i na Budžet</p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-md">
                Preneseni ostatak/minus utiče i na raspoloživi budžet za slidere (trošenje,
                investiranje, davanje) na stranici Budžet.
              </p>
            </div>
            <Switch checked={carryOverAffectsBudget} disabled={!carryOverEnabled || savingCarryOver}
              onChange={v => void handleCarryOverBudgetToggle(v)} label="Primeni prenos i na Budžet" />
          </div>

          {carryOverError && (
            <p role="alert" className="text-sm text-red-400 pt-4 border-t border-white/5">{carryOverError}</p>
          )}
        </div>
      </section>

      {/* UPRAVLJANJE KATEGORIJAMA */}
      <section>
        <p className={sectionLabel}>Upravljanje kategorijama</p>
        <div className={`${card} overflow-hidden`}>
          {categoriesError ? (
            <div className="py-10 text-center text-sm text-red-400">{categoriesError}</div>
          ) : loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Učitavanje...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
              {/* Rashodi */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                      <TrendingDown size={16} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Rashodi</h4>
                  </div>
                  <button type="button" onClick={() => setAddModalType('expense')}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-orange-500 font-black hover:opacity-80 transition-opacity">
                    <Plus size={14} />
                    Dodaj novu
                  </button>
                </div>
                {expenseCategories.length === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-4">Nema kategorija</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEnd(expenseCategories)}>
                    <SortableContext items={expenseCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <ul className="space-y-2">
                        {expenseCategories.map(cat => (
                          <SortableCategoryRow key={cat.id} category={cat}
                            onEdit={() => setEditingCategory(cat)}
                            onDelete={() => void handleDeleteClick(cat)} />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
              {/* Prihodi */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <TrendingUp size={16} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Prihodi</h4>
                  </div>
                  <button type="button" onClick={() => setAddModalType('income')}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-orange-500 font-black hover:opacity-80 transition-opacity">
                    <Plus size={14} />
                    Dodaj novu
                  </button>
                </div>
                {incomeCategories.length === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-4">Nema kategorija</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEnd(incomeCategories)}>
                    <SortableContext items={incomeCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <ul className="space-y-2">
                        {incomeCategories.map(cat => (
                          <SortableCategoryRow key={cat.id} category={cat}
                            onEdit={() => setEditingCategory(cat)}
                            onDelete={() => void handleDeleteClick(cat)} />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PODRŠKA I POMOĆ */}
      <section>
        <p className={sectionLabel}>Podrška i pomoć</p>
        <div className={`${card} p-8 flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
              <Mail size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Imate pitanje?</h4>
              <p className="text-sm text-slate-400 max-w-sm">Stojimo Vam na raspolaganju za sva pitanja i sugestije. Kontaktirajte nas i odgovorićemo što pre.</p>
            </div>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Novčanik - Podrška`}
            className="whitespace-nowrap bg-orange-500 hover:bg-orange-600 text-[#2d1600] px-8 py-3 rounded-full font-bold text-sm transition-all active:scale-95 shrink-0"
          >
            Kontaktiraj podršku
          </a>
        </div>
      </section>

      {/* INSTALIRAJ APLIKACIJU — samo mobilni, samo ako nije već instalirana */}
      {!isInstalled && (canInstall || isIOS) && (
        <section className="md:hidden">
          <p className={sectionLabel}>Instaliraj aplikaciju</p>
          <div className={`${card} p-6`}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                <Smartphone size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Dodaj na početni ekran</p>
                <p className="text-xs text-slate-400 mt-0.5">Koristi Novčanik kao pravu aplikaciju, bez browsera.</p>
              </div>
            </div>
            {isIOS ? (
              <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-slate-300">Kako instalirati na iPhone/iPad:</p>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p className="text-xs text-slate-400">Klikni na <Share size={11} className="inline mb-0.5" /> <span className="text-white font-semibold">Share</span> dugme u Safari browseru (dole u sredini)</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p className="text-xs text-slate-400">Izaberi <span className="text-white font-semibold">"Add to Home Screen"</span></p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p className="text-xs text-slate-400">Klikni <span className="text-white font-semibold">"Add"</span> u gornjem desnom uglu</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => void install()}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-[#2d1600] font-bold rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Smartphone size={16} />
                Instaliraj aplikaciju
              </button>
            )}
          </div>
        </section>
      )}


      {/* OTVORENI KOD I SIGURNOST */}
      <section>
        <p className={sectionLabel}>Otvoreni kod i sigurnost</p>
        <div className={`${card} p-6 flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
              <Code2 size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Otvoreni kod i sigurnost</h4>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Naš kod je u potpunosti otvoren kako bi svi mogli da se uvere u sigurnost i privatnost podataka. Mi nemamo pristup vašim podacima, niti bilo ko drugi.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/radisakicos/novcanik"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 whitespace-nowrap bg-white/10 hover:bg-white/15 border border-white/10 text-white px-6 py-3 rounded-full font-bold text-sm transition-all active:scale-95 shrink-0"
          >
            <Github size={17} />
            Pogledaj na GitHub-u
          </a>
        </div>
      </section>

      {/* PODRŽI PROJEKAT */}
      <section>
        <p className={sectionLabel}>Podrži projekat</p>
        <div className={`${card} p-6 flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Pomozite razvoju</h4>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Novčanik je besplatan alat otvorenog koda. Vaše donacije nam pomažu da pokrijemo troškove servera i nastavimo sa razvojem novih funkcija za sve korisnike.
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => setShowQR('lightning')}
              className="flex flex-col items-center gap-1.5 px-5 py-3 bg-[#f7931a]/10 hover:bg-[#f7931a]/20 border border-[#f7931a]/30 rounded-2xl transition-all active:scale-95"
            >
              <Zap size={20} className="text-[#f7931a]" />
              <span className="text-[11px] font-black text-white tracking-wide">Bitcoin Lightning</span>
              <span className="text-[9px] font-bold text-[#f7931a] uppercase tracking-widest">Prikaži QR</span>
            </button>
            <button
              onClick={() => setShowQR('usdt')}
              className="flex flex-col items-center gap-1.5 px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl transition-all active:scale-95"
            >
              <CircleDollarSign size={20} className="text-emerald-400" />
              <span className="text-[11px] font-black text-white tracking-wide">USDT (TRC20)</span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Prikaži QR</span>
            </button>
          </div>
        </div>
      </section>

      {/* QR modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowQR(null)} />
          <div className="relative w-full max-w-xs bg-[#111418] border border-white/10 rounded-2xl shadow-2xl p-6 text-center">
            <button onClick={() => setShowQR(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${showQR === 'lightning' ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'}`}>
              {showQR === 'lightning'
                ? <Zap size={20} className="text-[#f7931a]" />
                : <CircleDollarSign size={20} className="text-emerald-400" />}
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {showQR === 'lightning' ? 'Bitcoin Lightning' : 'USDT (TRC20)'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Skenirajte QR kod vašim novčanikom</p>
            <img
              src={showQR === 'lightning' ? '/qr/Lightning.PNG' : '/qr/USDT.JPG'}
              alt={showQR === 'lightning' ? 'Bitcoin Lightning QR' : 'USDT TRC20 QR'}
              className="w-48 h-48 rounded-xl mx-auto object-contain"
            />
          </div>
        </div>
      )}

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {addModalType && <CategoryFormModal category={null} type={addModalType} onClose={() => setAddModalType(null)} onSaved={refetch} />}
      {editingCategory && <CategoryFormModal category={editingCategory} type={editingCategory.type} onClose={() => setEditingCategory(null)} onSaved={refetch} />}
      {deletingCategory && <DeleteModal category={deletingCategory} txCount={txCount} onClose={() => setDeletingCategory(null)} onConfirm={handleDeleteConfirm} onRename={() => { setEditingCategory(deletingCategory); setDeletingCategory(null) }} />}
    </div>
  )
}
