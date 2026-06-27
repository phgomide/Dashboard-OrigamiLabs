import type { Lead, LeadImportPreviewRow, LeadImportSummary, OrigamiLead, OrigamiLeadInput, OrigamiLeadStatus } from '../types'
import { leadFromRow, leadToRow } from './mappers'
import { assertNoError, requireSupabase } from './repository'

const IMPORT_ORIGIN = 'pesquisa_manual_json'
export const ORIGAMI_LEAD_STATUSES: OrigamiLeadStatus[] = ['novo', 'contatado', 'respondeu', 'interessado', 'proposta_enviada', 'fechado', 'perdido', 'sem_resposta']

type LeadRow = Record<string, unknown>
type RawLead = Record<string, unknown>

function textOrNull(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function requiredText(value: unknown, label: string, errors: string[]) {
  const text = textOrNull(value)
  if (!text) errors.push(`${label} e obrigatorio.`)
  return text ?? ''
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function isEmptyLeadValue(value: unknown) {
  return value === null || value === undefined || String(value).trim() === ''
}

function mapRawKeys(raw: RawLead) {
  return {
    nome_negocio: raw.nome_negocio ?? raw.nomeNegocio,
    nome_dono: raw.nome_dono ?? raw.nomeDono,
    cidade: raw.cidade,
    google_maps_url: raw.google_maps_url ?? raw.googleMapsUrl,
    telefone: raw.telefone,
    whatsapp: raw.whatsapp,
    instagram: raw.instagram,
    site: raw.site,
    nicho: raw.nicho,
    oportunidade: raw.oportunidade,
    score: raw.score,
    observacao_comercial: raw.observacao_comercial ?? raw.observacaoComercial,
    status: raw.status,
    origem: raw.origem,
  }
}

function firstDateAfter(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function statusToPipeline(status: OrigamiLeadStatus): Lead['pipelineStatus'] {
  const map: Record<OrigamiLeadStatus, Lead['pipelineStatus']> = {
    novo: 'Novo lead',
    contatado: 'Primeiro contato',
    respondeu: 'Conversando',
    interessado: 'Conversando',
    proposta_enviada: 'Proposta enviada',
    fechado: 'Fechado',
    perdido: 'Perdido',
    sem_resposta: 'Futuro',
  }
  return map[status]
}

function scoreToTemperature(score: number): Lead['temperature'] {
  if (score >= 4) return 'Quente'
  if (score === 3) return 'Morno'
  return 'Frio'
}

function scoreToPriority(score: number): Lead['priority'] {
  if (score >= 4) return 'Alta'
  if (score === 3) return 'Média'
  return 'Baixa'
}

function pipelineToStatus(status: Lead['pipelineStatus']): OrigamiLeadStatus {
  if (status === 'Primeiro contato') return 'contatado'
  if (status === 'Proposta enviada') return 'proposta_enviada'
  if (status === 'Fechado') return 'fechado'
  if (status === 'Perdido') return 'perdido'
  if (status === 'Futuro') return 'sem_resposta'
  if (status === 'Conversando') return 'respondeu'
  return 'novo'
}

function appendImportNotes(input: OrigamiLeadInput) {
  const links = [
    input.googleMapsUrl ? `Google Maps: ${input.googleMapsUrl}` : '',
    input.instagram ? `Instagram: ${input.instagram}` : '',
    input.site ? `Site: ${input.site}` : '',
    input.telefone ? `Telefone: ${input.telefone}` : '',
    input.whatsapp ? `WhatsApp: ${input.whatsapp}` : '',
  ].filter(Boolean)
  return [input.observacaoComercial, ...links].filter(Boolean).join('\n')
}

export function origamiInputToLead(input: OrigamiLeadInput): Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    businessName: input.nomeNegocio,
    contactName: input.nomeDono ?? undefined,
    ownerName: input.nomeDono ?? undefined,
    city: input.cidade,
    niche: input.nicho,
    source: input.origem === IMPORT_ORIGIN ? 'Pesquisa manual JSON' : input.origem,
    publicLink: input.googleMapsUrl ?? input.site ?? input.instagram ?? undefined,
    googleMapsUrl: input.googleMapsUrl ?? undefined,
    phone: input.telefone ?? undefined,
    whatsapp: input.whatsapp ?? undefined,
    instagram: input.instagram ?? undefined,
    website: input.site ?? undefined,
    commercialNote: input.observacaoComercial ?? undefined,
    importScore: input.score,
    importOrigin: input.origem,
    projectInterest: input.oportunidade,
    pipelineStatus: statusToPipeline(input.status),
    temperature: scoreToTemperature(input.score),
    priority: scoreToPriority(input.score),
    estimatedValue: 0,
    paymentStatus: 'Não se aplica',
    nextActionDate: firstDateAfter(2),
    nextAction: 'Fazer primeiro contato',
    notes: appendImportNotes(input) || undefined,
  }
}

function leadToOrigamiLead(lead: Lead): OrigamiLead {
  return {
    id: lead.id,
    nomeNegocio: lead.businessName,
    nomeDono: lead.ownerName ?? lead.contactName ?? null,
    cidade: lead.city,
    googleMapsUrl: lead.googleMapsUrl ?? lead.publicLink ?? null,
    telefone: lead.phone ?? null,
    whatsapp: lead.whatsapp ?? null,
    instagram: lead.instagram ?? null,
    site: lead.website ?? null,
    nicho: lead.niche,
    oportunidade: lead.projectInterest,
    score: lead.importScore ?? (lead.temperature === 'Quente' ? 4 : lead.temperature === 'Morno' ? 3 : 2),
    observacaoComercial: lead.commercialNote ?? lead.notes ?? null,
    status: pipelineToStatus(lead.pipelineStatus),
    origem: lead.importOrigin ?? lead.source ?? null,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  }
}

function leadPatchToRow(patch: Partial<Lead>) {
  const row: Record<string, unknown> = {}
  if ('businessName' in patch) row.business_name = patch.businessName
  if ('contactName' in patch) row.contact_name = patch.contactName || null
  if ('ownerName' in patch) row.owner_name = patch.ownerName || null
  if ('city' in patch) row.city = patch.city
  if ('niche' in patch) row.niche = patch.niche
  if ('source' in patch) row.source = patch.source
  if ('publicLink' in patch) row.public_link = patch.publicLink || null
  if ('googleMapsUrl' in patch) row.google_maps_url = patch.googleMapsUrl || null
  if ('phone' in patch) row.phone = patch.phone || null
  if ('whatsapp' in patch) row.whatsapp = patch.whatsapp || null
  if ('instagram' in patch) row.instagram = patch.instagram || null
  if ('website' in patch) row.website = patch.website || null
  if ('commercialNote' in patch) row.commercial_note = patch.commercialNote || null
  if ('importScore' in patch) row.import_score = patch.importScore ?? null
  if ('importOrigin' in patch) row.import_origin = patch.importOrigin || null
  if ('projectInterest' in patch) row.project_interest = patch.projectInterest
  if ('pipelineStatus' in patch) row.pipeline_status = patch.pipelineStatus
  if ('temperature' in patch) row.lead_temperature = patch.temperature
  if ('priority' in patch) row.priority = patch.priority
  if ('notes' in patch) row.notes = patch.notes || null
  return row
}

function origamiPatchToLeadPatch(input: Partial<OrigamiLeadInput>): Partial<Lead> {
  const patch: Partial<Lead> = {}
  if ('nomeNegocio' in input) patch.businessName = input.nomeNegocio
  if ('nomeDono' in input) {
    patch.contactName = input.nomeDono ?? undefined
    patch.ownerName = input.nomeDono ?? undefined
  }
  if ('cidade' in input) patch.city = input.cidade
  if ('googleMapsUrl' in input) {
    patch.googleMapsUrl = input.googleMapsUrl ?? undefined
    patch.publicLink = input.googleMapsUrl ?? undefined
  }
  if ('telefone' in input) patch.phone = input.telefone ?? undefined
  if ('whatsapp' in input) patch.whatsapp = input.whatsapp ?? undefined
  if ('instagram' in input) patch.instagram = input.instagram ?? undefined
  if ('site' in input) patch.website = input.site ?? undefined
  if ('nicho' in input) patch.niche = input.nicho
  if ('oportunidade' in input) patch.projectInterest = input.oportunidade
  if ('score' in input && input.score) {
    patch.importScore = input.score
    patch.temperature = scoreToTemperature(input.score)
    patch.priority = scoreToPriority(input.score)
  }
  if ('observacaoComercial' in input) {
    patch.commercialNote = input.observacaoComercial ?? undefined
    patch.notes = input.observacaoComercial ?? undefined
  }
  if ('status' in input && input.status) patch.pipelineStatus = statusToPipeline(input.status)
  if ('origem' in input) patch.importOrigin = input.origem
  return patch
}

export function parseOrigamiLeadJson(json: string) {
  const parsed = JSON.parse(json) as unknown
  if (!Array.isArray(parsed) && (typeof parsed !== 'object' || parsed === null)) {
    throw new Error('O JSON precisa ser um objeto ou um array de objetos.')
  }
  return Array.isArray(parsed) ? parsed : [parsed]
}

export function normalizeOrigamiLead(rawValue: unknown): { input?: OrigamiLeadInput; errors: string[] } {
  const errors: string[] = []
  if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
    return { errors: ['A linha precisa ser um objeto JSON.'] }
  }

  const raw = mapRawKeys(rawValue as RawLead)
  const score = Number(raw.score)
  if (!Number.isInteger(score) || score < 1 || score > 5) errors.push('score precisa ser um numero inteiro entre 1 e 5.')

  const statusValue = textOrNull(raw.status) ?? 'novo'
  if (!ORIGAMI_LEAD_STATUSES.includes(statusValue as OrigamiLeadStatus)) {
    errors.push(`status deve ser um destes valores: ${ORIGAMI_LEAD_STATUSES.join(', ')}.`)
  }

  const input: OrigamiLeadInput = {
    nomeNegocio: requiredText(raw.nome_negocio, 'nome_negocio', errors),
    nomeDono: textOrNull(raw.nome_dono),
    cidade: requiredText(raw.cidade, 'cidade', errors),
    googleMapsUrl: textOrNull(raw.google_maps_url),
    telefone: textOrNull(raw.telefone),
    whatsapp: textOrNull(raw.whatsapp),
    instagram: textOrNull(raw.instagram),
    site: textOrNull(raw.site),
    nicho: requiredText(raw.nicho, 'nicho', errors),
    oportunidade: requiredText(raw.oportunidade, 'oportunidade', errors),
    score,
    observacaoComercial: textOrNull(raw.observacao_comercial),
    status: ORIGAMI_LEAD_STATUSES.includes(statusValue as OrigamiLeadStatus) ? statusValue as OrigamiLeadStatus : 'novo',
    origem: textOrNull(raw.origem) ?? IMPORT_ORIGIN,
  }

  return errors.length > 0 ? { errors } : { input, errors: [] }
}

function findDuplicate(input: OrigamiLeadInput, existing: OrigamiLead[]) {
  const maps = normalizeKey(input.googleMapsUrl)
  if (maps) {
    const byMaps = existing.find((lead) => normalizeKey(lead.googleMapsUrl) === maps)
    if (byMaps) return byMaps
  }

  const contacts = [input.telefone, input.whatsapp].map(normalizeKey).filter(Boolean)
  if (contacts.length > 0) {
    const byContact = existing.find((lead) => [lead.telefone, lead.whatsapp].map(normalizeKey).some((item) => contacts.includes(item)))
    if (byContact) return byContact
  }

  const name = normalizeKey(input.nomeNegocio)
  const city = normalizeKey(input.cidade)
  return existing.find((lead) => normalizeKey(lead.nomeNegocio) === name && normalizeKey(lead.cidade) === city)
}

function buildUpdatePatch(input: OrigamiLeadInput, existing: OrigamiLead, overwrite: boolean) {
  const patch: Partial<OrigamiLeadInput> = {}
  for (const key of Object.keys(input) as Array<keyof OrigamiLeadInput>) {
    const incoming = input[key]
    if (incoming === null || incoming === undefined || String(incoming).trim() === '') continue
    const current = existing[key as keyof OrigamiLead]
    if (overwrite || isEmptyLeadValue(current)) {
      Object.assign(patch, { [key]: incoming })
    }
  }
  return patch
}

export function buildOrigamiLeadPreview(rawItems: unknown[], existing: OrigamiLead[], overwrite = false): LeadImportPreviewRow[] {
  const known = [...existing]
  return rawItems.map((raw, index) => {
    const normalized = normalizeOrigamiLead(raw)
    if (!normalized.input) return { index, action: 'erro', errors: normalized.errors }

    const duplicate = findDuplicate(normalized.input, known)
    if (!duplicate) {
      known.push({
        id: `preview-${index}`,
        ...normalized.input,
        createdAt: null,
        updatedAt: null,
      })
      return { index, action: 'criar', input: normalized.input, errors: [] }
    }

    const updatePatch = buildUpdatePatch(normalized.input, duplicate, overwrite)
    return {
      index,
      action: Object.keys(updatePatch).length > 0 ? 'atualizar' : 'ignorar',
      input: normalized.input,
      existing: duplicate,
      updatePatch,
      errors: [],
    }
  })
}

export async function listOrigamiLeads() {
  const { data, error } = await requireSupabase()
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  assertNoError(error)
  return (data ?? []).map((row) => leadToOrigamiLead(leadFromRow(row as LeadRow)))
}

export async function previewOrigamiLeadImport(json: string, overwrite = false) {
  const rawItems = parseOrigamiLeadJson(json)
  const existing = await listOrigamiLeads()
  return buildOrigamiLeadPreview(rawItems, existing, overwrite)
}

export async function importOrigamiLeads(json: string, overwrite = false): Promise<{ rows: LeadImportPreviewRow[]; summary: LeadImportSummary }> {
  const rows = await previewOrigamiLeadImport(json, overwrite)
  const summary: LeadImportSummary = { created: 0, updated: 0, ignored: 0, errors: 0 }
  const client = requireSupabase()

  for (const row of rows) {
    if (row.action === 'erro' || !row.input) {
      summary.errors += 1
      continue
    }
    if (row.action === 'ignorar') {
      summary.ignored += 1
      continue
    }
    if (row.action === 'criar') {
      const { error } = await client.from('leads').insert(leadToRow(origamiInputToLead(row.input)))
      assertNoError(error)
      summary.created += 1
      continue
    }
    if (row.action === 'atualizar' && row.existing && row.updatePatch) {
      const { error } = await client.from('leads').update(leadPatchToRow(origamiPatchToLeadPatch(row.updatePatch))).eq('id', row.existing.id)
      assertNoError(error)
      summary.updated += 1
    }
  }

  window.dispatchEvent(new Event('origami:leads-imported'))
  return { rows, summary }
}

export async function updateOrigamiLeadStatus(id: string, status: OrigamiLeadStatus) {
  const { data, error } = await requireSupabase()
    .from('leads')
    .update({ pipeline_status: statusToPipeline(status) })
    .eq('id', id)
    .select()
    .single()
  assertNoError(error)
  return leadToOrigamiLead(leadFromRow(data as LeadRow))
}

export function previewSummary(rows: LeadImportPreviewRow[]): LeadImportSummary {
  return rows.reduce<LeadImportSummary>((summary, row) => {
    if (row.action === 'criar') summary.created += 1
    if (row.action === 'atualizar') summary.updated += 1
    if (row.action === 'ignorar') summary.ignored += 1
    if (row.action === 'erro') summary.errors += 1
    return summary
  }, { created: 0, updated: 0, ignored: 0, errors: 0 })
}
