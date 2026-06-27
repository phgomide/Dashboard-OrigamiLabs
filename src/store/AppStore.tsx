import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { initialActivities, initialLeads, initialProjects, initialProposals } from '../data/mockData'
import type { Activity, Lead, Project, Proposal } from '../types'
import { useAuth } from '../auth/useAuth'
import * as leadService from '../services/leads'
import * as activityService from '../services/activities'
import * as proposalService from '../services/proposals'
import * as projectService from '../services/projects'
import { AppStoreContext, type AppStoreValue } from './AppStoreContext'

const demoKey = 'origami-command-center-demo-v2'
function demoLeads() { try { return JSON.parse(localStorage.getItem(demoKey) ?? 'null')?.leads ?? initialLeads } catch { return initialLeads } }

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { demoMode } = useAuth()
  const [leads, setLeads] = useState<Lead[]>(demoMode ? demoLeads : [])
  const [activities, setActivities] = useState<Activity[]>(demoMode ? initialActivities : [])
  const [proposals, setProposals] = useState<Proposal[]>(demoMode ? initialProposals : [])
  const [projects, setProjects] = useState<Project[]>(demoMode ? initialProjects : [])
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    if (demoMode) { setLeads(demoLeads()); setActivities(initialActivities); setProposals(initialProposals); setProjects(initialProjects); setLoading(false); return }
    let active=true; setLoading(true); setError(null)
    Promise.all([leadService.listLeads(),activityService.listActivities(),proposalService.listProposals(),projectService.listProjects()])
      .then(([nextLeads,nextActivities,nextProposals,nextProjects]) => { if(active){setLeads(nextLeads);setActivities(nextActivities);setProposals(nextProposals);setProjects(nextProjects)} })
      .catch(() => { if(active)setError('Não foi possível carregar o workspace. Verifique a conexão e tente novamente.') })
      .finally(() => { if(active)setLoading(false) })
    return () => { active=false }
  }, [demoMode])
  useEffect(() => {
    if (demoMode) return
    const reloadLeads = () => {
      leadService.listLeads().then(setLeads).catch(() => setError('Nao foi possivel atualizar os leads importados.'))
    }
    window.addEventListener('origami:leads-imported', reloadLeads)
    return () => window.removeEventListener('origami:leads-imported', reloadLeads)
  }, [demoMode])
  useEffect(() => { if(demoMode)localStorage.setItem(demoKey,JSON.stringify({leads})) },[demoMode,leads])

  const addLead=useCallback(async(lead:Lead)=>{const saved=demoMode?lead:await leadService.createLead(lead);setLeads((items)=>[saved,...items])},[demoMode])
  const updateLead=useCallback(async(id:string,patch:Partial<Lead>)=>{const current=leads.find((item)=>item.id===id);if(!current)return;const saved=demoMode?{...current,...patch,updatedAt:new Date().toISOString()}:await leadService.updateLead(id,patch,current);setLeads((items)=>items.map((item)=>item.id===id?saved:item))},[demoMode,leads])
  const deleteLead=useCallback(async(id:string)=>{if(!demoMode)await leadService.deleteLead(id);setLeads((items)=>items.filter((item)=>item.id!==id))},[demoMode])
  const addActivity=useCallback(async(value:Activity)=>{const saved=demoMode?value:await activityService.createActivity(value);setActivities((items)=>[saved,...items])},[demoMode])
  const updateActivity=useCallback(async(value:Activity)=>{const saved=demoMode?value:await activityService.updateActivity(value.id,value);setActivities((items)=>items.map((item)=>item.id===value.id?saved:item))},[demoMode])
  const deleteActivity=useCallback(async(id:string)=>{if(!demoMode)await activityService.deleteActivity(id);setActivities((items)=>items.filter((item)=>item.id!==id))},[demoMode])
  const addProposal=useCallback(async(value:Proposal)=>{const saved=demoMode?value:await proposalService.createProposal(value);setProposals((items)=>[saved,...items])},[demoMode])
  const updateProposal=useCallback(async(value:Proposal)=>{const saved=demoMode?value:await proposalService.updateProposal(value.id,value);setProposals((items)=>items.map((item)=>item.id===value.id?saved:item))},[demoMode])
  const deleteProposal=useCallback(async(id:string)=>{if(!demoMode)await proposalService.deleteProposal(id);setProposals((items)=>items.filter((item)=>item.id!==id))},[demoMode])
  const addProject=useCallback(async(value:Project)=>{const saved=demoMode?value:await projectService.createProject(value);setProjects((items)=>[saved,...items])},[demoMode])
  const updateProject=useCallback(async(value:Project)=>{const saved=demoMode?value:await projectService.updateProject(value.id,value);setProjects((items)=>items.map((item)=>item.id===value.id?saved:item))},[demoMode])
  const deleteProject=useCallback(async(id:string)=>{if(!demoMode)await projectService.deleteProject(id);setProjects((items)=>items.filter((item)=>item.id!==id))},[demoMode])

  const value=useMemo<AppStoreValue>(()=>({leads,activities,proposals,projects,loading,error,dataSource:demoMode?'demo':'supabase',addLead,updateLead,deleteLead,moveLead:(id,status)=>updateLead(id,{pipelineStatus:status}),addActivity,updateActivity,deleteActivity,toggleActivity:async(id)=>{const item=activities.find((entry)=>entry.id===id);if(item)await updateActivity({...item,status:item.status==='Concluída'?'Pendente':'Concluída'})},addProposal,updateProposal,deleteProposal,addProject,updateProject,deleteProject}),[leads,activities,proposals,projects,loading,error,demoMode,addLead,updateLead,deleteLead,addActivity,updateActivity,deleteActivity,addProposal,updateProposal,deleteProposal,addProject,updateProject,deleteProject])
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}
