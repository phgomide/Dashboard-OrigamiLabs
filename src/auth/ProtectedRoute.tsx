import type { ReactNode } from 'react'
import { useAuth } from './useAuth'
import { LoginPage } from './LoginPage'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, demoMode } = useAuth()
  if (loading) return <div className="auth-loader" aria-busy="true"><img src="/brand/origami-logo.png" alt="" /><span>Preparando seu workspace…</span></div>
  if (!user && !demoMode) return <LoginPage />
  return children
}
