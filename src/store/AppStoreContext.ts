import { createContext } from 'react'
import type { Activity, Lead, PipelineStatus, Project, Proposal } from '../types'

export interface AppStoreValue {
  leads: Lead[]
  activities: Activity[]
  proposals: Proposal[]
  projects: Project[]
  loading: boolean
  error: string | null
  dataSource: 'supabase' | 'demo'
  addLead: (lead: Lead) => Promise<void>
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  moveLead: (id: string, status: PipelineStatus) => Promise<void>
  addActivity: (activity: Activity) => Promise<void>
  updateActivity: (activity: Activity) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  toggleActivity: (id: string) => Promise<void>
  addProposal: (proposal: Proposal) => Promise<void>
  updateProposal: (proposal: Proposal) => Promise<void>
  deleteProposal: (id: string) => Promise<void>
  addProject: (project: Project) => Promise<void>
  updateProject: (project: Project) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const AppStoreContext = createContext<AppStoreValue | null>(null)
