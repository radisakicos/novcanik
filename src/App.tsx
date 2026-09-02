import { type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'
import { OnboardingPage } from './pages/OnboardingPage'
import { Dashboard } from './pages/Dashboard'
import { Transakcije } from './pages/Transakcije'
import { Budzet } from './pages/Budzet'
import { Izvestaji } from './pages/Izvestaji'
import { Podesavanja } from './pages/Podesavanja'

function OnboardingGuard({ children }: { children: ReactNode }) {
  const { session, loading, onboardingCompleted } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111417] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (onboardingCompleted === true) return <Navigate to="/" replace />

  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          <Route
            path="/onboarding"
            element={
              <OnboardingGuard>
                <OnboardingPage />
              </OnboardingGuard>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="transakcije" element={<Transakcije />} />
            <Route path="budzet" element={<Budzet />} />
            <Route path="izvestaji" element={<Izvestaji />} />
            <Route path="podesavanja" element={<Podesavanja />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
