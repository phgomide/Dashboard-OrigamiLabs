import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AuthContext, type AuthValue } from './AuthState'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [demoMode, setDemoMode] = useState(() => !isSupabaseConfigured && sessionStorage.getItem('origami-demo') === 'true')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false) })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthValue>(() => ({
    user: session?.user ?? null,
    loading,
    demoMode,
    configured: isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) throw new Error('Supabase não configurado.')
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error) throw new Error('E-mail ou senha inválidos.')
    },
    enterDemo: () => { sessionStorage.setItem('origami-demo', 'true'); setDemoMode(true) },
    signOut: async () => {
      sessionStorage.removeItem('origami-demo'); setDemoMode(false)
      if (supabase) await supabase.auth.signOut({ scope: 'local' })
    },
  }), [session, loading, demoMode])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
