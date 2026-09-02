import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Wallet, BarChart2, Settings, LogOut } from 'lucide-react'

import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/', label: 'Pregled', icon: LayoutDashboard, end: true },
  { to: '/transakcije', label: 'Transakcije', icon: Receipt, end: false },
  { to: '/budzet', label: 'Budžet', icon: Wallet, end: false },
  { to: '/izvestaji', label: 'Izveštaji', icon: BarChart2, end: false },
  { to: '/podesavanja', label: 'Podešavanja', icon: Settings, end: false },
] as const

export function Sidebar() {
  const { signOut, user, fullName } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col z-40">
      <div className="px-4 py-6">
        <span className="font-display text-2xl font-bold text-orange-500 tracking-tighter">
          Novčanik
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 mt-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 py-3 px-6 transition-all ${
                isActive
                  ? 'text-orange-500 border-r-2 border-orange-500 bg-orange-500/5 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#191c1f] border border-[#554335]">
          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-orange-400">
              {fullName ? fullName.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : (user?.email?.[0]?.toUpperCase() ?? '?')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#e1e2e7] truncate">{fullName ?? user?.email}</p>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors mt-0.5"
            >
              <LogOut size={11} />
              Odjavi se
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
