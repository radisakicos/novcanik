import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Github } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

type AuthMode = 'login' | 'signup' | 'forgot'

interface PasswordStrength {
  score: number
  label: string
  color: string
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Slaba', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Osrednja', color: 'bg-yellow-500' }
  if (score <= 3) return { score, label: 'Dobra', color: 'bg-blue-500' }
  return { score, label: 'Jaka', color: 'bg-green-500' }
}

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session } = useAuth()

  useEffect(() => {
    if (searchParams.get('tab') === 'signup') setMode('signup')
  }, [searchParams])

  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [session, navigate])

  const strength = mode === 'signup' && password.length > 0
    ? getPasswordStrength(password)
    : null

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (mode === 'signup' && password.length < 8) {
      setError('Lozinka mora imati najmanje 8 karaktera.')
      return
    }

    if (mode === 'signup' && !inviteCode.trim()) {
      setError('Invite kod je obavezan za registraciju.')
      return
    }

    if (mode === 'signup' && !agreedToTerms) {
      setError('Morate prihvatiti Politiku privatnosti i Uslove korišćenja.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      } else if (mode === 'signup') {
        // 1. Provjeri kod prije registracije
        const { data: codeCheck } = await supabase
          .from('invite_codes')
          .select('used')
          .eq('code', inviteCode.trim().toUpperCase())
          .single()

        if (!codeCheck) {
          setError('Invite kod ne postoji.')
          setLoading(false)
          return
        }
        if (codeCheck.used) {
          setError('Ovaj invite kod je već iskorišten.')
          setLoading(false)
          return
        }

        // 2. Registruj korisnika
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr

        // 3. Atomično zauzmi kod
        if (signUpData.user) {
          await supabase.rpc('claim_invite_code', {
            p_code: inviteCode.trim(),
            p_user_id: signUpData.user.id,
          })
        }

        setInfo('Provjeri email i klikni link za potvrdu, pa se prijavi.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setInfo('Ako postoji nalog sa tim emailom, stigće ti link za resetovanje lozinke.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Email adresa nije potvrđena. Proveri inbox i klikni link koji smo ti poslali.')
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Pogrešan email ili lozinka.')
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already exists')) {
        setError('Nalog sa ovim emailom već postoji.')
      } else if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('email')) {
        setError('Ova email adresa nije prihvaćena. Pokušaj sa drugom adresom.')
      } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
        setError('Previše pokušaja. Sačekaj nekoliko minuta pa pokušaj ponovo.')
      } else {
        setError('Greška pri registraciji. Pokušaj ponovo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#111417] flex items-center justify-center p-4">
      <div className="centered-hero-gradient fixed inset-0 pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <span className="font-display text-3xl font-black tracking-tighter text-orange-500 mb-1">
            Novčanik
          </span>
          <p className="text-sm text-slate-500">Pratite svoje finansije jednostavno</p>
        </div>

        <div className="glass-card rounded-2xl border border-orange-500/10 p-6">
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-slate-800/50 p-1 mb-6">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setInfo(null); setPassword('') }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    mode === m
                      ? 'bg-slate-700 text-[#e1e2e7] shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m === 'login' ? 'Prijava' : 'Registracija'}
                </button>
              ))}
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-5">
              <button
                onClick={() => { setMode('login'); setError(null); setInfo(null) }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4"
              >
                ← Nazad na prijavu
              </button>
              <h2 className="text-base font-bold text-white">Resetuj lozinku</h2>
              <p className="text-xs text-slate-500 mt-1">Unesite email adresu vašeg naloga i poslaćemo vam link za resetovanje.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-700 rounded-lg bg-slate-800/50 text-[#e1e2e7] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                placeholder="email@primer.com"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                    Lozinka
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); setInfo(null) }}
                      className="text-xs text-slate-500 hover:text-orange-400 transition-colors"
                    >
                      Zaboravili ste lozinku?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'signup' ? 8 : 1}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 border border-slate-700 rounded-lg bg-slate-800/50 text-[#e1e2e7] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                    placeholder={mode === 'signup' ? 'Minimum 8 karaktera' : 'Lozinka'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {strength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= strength.score ? strength.color : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Jačina lozinke: <span className="font-medium text-slate-400">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label htmlFor="invite" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Invite kod
                </label>
                <input
                  id="invite"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-lg bg-slate-800/50 text-[#e1e2e7] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-mono tracking-widest"
                  placeholder=""
                />
                <p className="text-[11px] text-slate-600 mt-1">Kod dobijate od administratora.</p>
              </div>
            )}

            {mode === 'signup' && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 shrink-0 accent-orange-500"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  Prihvatam{' '}
                  <Link to="/privacy-policy?from=signup" className="text-orange-400 hover:text-orange-300 transition-colors">
                    Politiku privatnosti
                  </Link>
                  {' '}i{' '}
                  <Link to="/terms-of-service?from=signup" className="text-orange-400 hover:text-orange-300 transition-colors">
                    Uslove korišćenja
                  </Link>
                </span>
              </label>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-400">{error}</p>
            )}

            {info && (
              <p role="status" className="text-sm text-green-400">{info}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-[#2d1600] font-bold rounded-xl transition-all active:scale-95 mt-2"
            >
              {loading
                ? 'Učitavanje...'
                : mode === 'login'
                  ? 'Prijavi se'
                  : mode === 'signup'
                    ? 'Napravi nalog'
                    : 'Pošalji link'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-center text-xs text-slate-500 mt-4">
              Nemate invite kod?{' '}
              <a
                href="mailto:algo_founder@proton.me?subject=Novčanik - Zahtev za pristup"
                className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                Javite se administratoru
              </a>
            </p>
          )}
        </div>

        <div className="mt-5 text-center">
          <a
            href="https://github.com/radisakicos/novcanik"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            <Github size={13} />
            Aplikacija je open source — pogledaj kod
          </a>
        </div>
      </div>
    </div>
  )
}
