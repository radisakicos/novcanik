import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  onboardingCompleted: boolean | null
  setOnboardingCompleted: (v: boolean) => void
  currency: string
  setCurrency: (c: string) => void
  fullName: string | null
  setFullName: (name: string) => void
  carryOverEnabled: boolean
  setCarryOverEnabled: (v: boolean) => void
  carryOverAffectsBudget: boolean
  setCarryOverAffectsBudget: (v: boolean) => void
  carryOverStartDate: string | null
  setCarryOverStartDate: (d: string | null) => void
  signOut: () => Promise<void>
}

// Lives here rather than next to AuthProvider: a module that exports both a
// component and a non-component breaks React Fast Refresh.
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
