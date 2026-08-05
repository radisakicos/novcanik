import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [currency, setCurrency] = useState('RSD')
  const [fullName, setFullName] = useState<string | null>(null)
  const [carryOverEnabled, setCarryOverEnabled] = useState(false)
  const [carryOverAffectsBudget, setCarryOverAffectsBudget] = useState(false)
  const [carryOverStartDate, setCarryOverStartDate] = useState<string | null>(null)

  const fetchSettings = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('onboarding_completed, currency, full_name, carry_over_enabled, carry_over_affects_budget, carry_over_start_date')
        .eq('id', userId)
        .single()
      setOnboardingCompleted(data?.onboarding_completed ?? false)
      setCurrency(data?.currency ?? 'RSD')
      setFullName(data?.full_name ?? null)
      setCarryOverEnabled(data?.carry_over_enabled ?? false)
      setCarryOverAffectsBudget(data?.carry_over_affects_budget ?? false)
      setCarryOverStartDate(data?.carry_over_start_date ?? null)
    } catch {
      setOnboardingCompleted(true)
      setCurrency('RSD')
    }
  }, [])

  useEffect(() => {
    let done = false

    const finish = () => {
      if (!done) { done = true; setLoading(false) }
    }

    const safetyTimer = setTimeout(() => {
      setOnboardingCompleted(prev => prev ?? true)
      finish()
    }, 5000)

    supabase.auth.getSession().then(async ({ data }) => {
      try {
        setSession(data.session)
        if (data.session) await fetchSettings(data.session.user.id)
      } finally {
        clearTimeout(safetyTimer)
        finish()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchSettings(session.user.id)
      } else {
        setOnboardingCompleted(null)
        setCurrency('RSD')
        setCarryOverEnabled(false)
        setCarryOverAffectsBudget(false)
        setCarryOverStartDate(null)
      }
    })

    return () => {
      done = true
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [fetchSettings])

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
    } catch {
      setSession(null)
    }
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      onboardingCompleted,
      setOnboardingCompleted,
      currency,
      setCurrency,
      fullName,
      setFullName,
      carryOverEnabled,
      setCarryOverEnabled,
      carryOverAffectsBudget,
      setCarryOverAffectsBudget,
      carryOverStartDate,
      setCarryOverStartDate,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
