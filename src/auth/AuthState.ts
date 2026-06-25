import type { User } from '@supabase/supabase-js'
import { createContext } from 'react'

export interface AuthValue {
  user: User | null
  loading: boolean
  demoMode: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  enterDemo: () => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
