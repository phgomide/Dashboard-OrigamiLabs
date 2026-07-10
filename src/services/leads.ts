import type { Lead } from '../types'
import { leadFromRow, leadToRow } from './mappers'
import { assertNoError, requireSupabase } from './repository'

export interface DuplicateLeadGroup {
  key: string
  label: string
  leads: Lead[]
}

const compact = (value?: string | null) => (value ?? '').trim().toLowerCase()
const normalizedSpaces = (value?: string | null) => compact(value).replace(/\s+/g, ' ')
const digits = (value?: string | null) => {
  const clean = (value ?? '').replace(/\D/g, '')
  return clean.startsWith('55') && clean.length > 11 ? clean.slice(2) : clean
}

function duplicateKeys(lead: Lead) {
  const keys: Array<{ key: string; label: string }> = []
  if (lead.automationDedupeKey) keys.push({ key: `automation:${compact(lead.automationDedupeKey)}`, label: 'chave da automação' })
  if (lead.googleMapsUrl) keys.push({ key: `maps:${compact(lead.googleMapsUrl)}`, label: 'Google Maps' })
  const phone = digits(lead.whatsapp ?? lead.phone)
  if (phone) keys.push({ key: `phone:${phone}`, label: 'telefone/WhatsApp' })
  const name = normalizedSpaces(lead.businessName)
  const city = normalizedSpaces(lead.city)
  if (name && city) keys.push({ key: `name-city:${name}:${city}`, label: 'nome + cidade' })
  return keys
}

export function findDuplicateLeadGroups(leads: Lead[]): DuplicateLeadGroup[] {
  const groups = new Map<string, { label: string; leads: Lead[] }>()
  for (const lead of leads) {
    for (const item of duplicateKeys(lead)) {
      const group = groups.get(item.key) ?? { label: item.label, leads: [] }
      if (!group.leads.some((entry) => entry.id === lead.id)) group.leads.push(lead)
      groups.set(item.key, group)
    }
  }

  const duplicateGroups = [...groups.entries()]
    .filter(([, group]) => group.leads.length > 1)
    .map(([key, group]) => ({ key, label: group.label, leads: group.leads }))

  const seen = new Set<string>()
  return duplicateGroups.filter((group) => {
    const signature = group.leads.map((lead) => lead.id).sort().join('|')
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}

export function isCleanupEligibleDuplicateGroup(group: DuplicateLeadGroup) {
  return group.key.startsWith('automation:')
}

export function countCleanupEligibleDuplicateExtras(groups: DuplicateLeadGroup[]) {
  return countDuplicateExtras(groups.filter(isCleanupEligibleDuplicateGroup))
}

export function countDuplicateExtras(groups: DuplicateLeadGroup[]) {
  const duplicateIds = new Set<string>()
  for (const group of groups) {
    const sorted = [...group.leads].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    for (const lead of sorted.slice(1)) duplicateIds.add(lead.id)
  }
  return duplicateIds.size
}

export function cleanupDuplicateLeadsLocal(leads: Lead[]) {
  const duplicateGroups = findDuplicateLeadGroups(leads).filter(isCleanupEligibleDuplicateGroup)
  const removeIds = new Set<string>()
  for (const group of duplicateGroups) {
    const sorted = [...group.leads].sort((a, b) => {
      const richness = (lead: Lead) => [lead.googleMapsUrl, lead.phone, lead.whatsapp, lead.instagram, lead.website, lead.personalizedMessage].filter(Boolean).length + (lead.pipelineStatus === 'Novo lead' ? 0 : 2)
      return richness(b) - richness(a) || a.createdAt.localeCompare(b.createdAt)
    })
    for (const lead of sorted.slice(1)) removeIds.add(lead.id)
  }
  return { leads: leads.filter((lead) => !removeIds.has(lead.id)), deletedCount: removeIds.size }
}

export async function listLeads(){ const {data,error}=await requireSupabase().from('leads').select('*').order('created_at',{ascending:false}); assertNoError(error); return (data??[]).map(leadFromRow) }
export async function createLead(value:Lead){ const {data,error}=await requireSupabase().from('leads').insert(leadToRow(value)).select().single(); assertNoError(error); return leadFromRow(data as Record<string,unknown>) }
export async function updateLead(id:string,patch:Partial<Lead>,current:Lead){ const {data,error}=await requireSupabase().from('leads').update(leadToRow({...current,...patch})).eq('id',id).select().single(); assertNoError(error); return leadFromRow(data as Record<string,unknown>) }
export async function deleteLead(id:string){ const {error}=await requireSupabase().from('leads').delete().eq('id',id); assertNoError(error) }
export async function cleanupDuplicateLeads(){ const {data,error}=await requireSupabase().rpc('cleanup_automation_lead_duplicates'); assertNoError(error); return Number(data ?? 0) }
