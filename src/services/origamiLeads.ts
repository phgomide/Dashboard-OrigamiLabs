import type { LeadImportPreviewRow, LeadImportSummary, OrigamiLead, OrigamiLeadInput, OrigamiLeadStatus } from '../types'
import { assertNoError, requireSupabase } from './repository'

const IMPORT_ORIGIN = 'pesquisa_manual_json'
export const ORIGAMI_LEAD_STATUSES: OrigamiLeadStatus[] = ['novo', 'contatado', 'respondeu', 'interessado', 'proposta_enviada', 'fechado', 'perdido', 'sem_resposta']

const dbFields = [
  'nome_negocio',
  'nome_dono',
  'cidade',
  'google_maps_url',
  'telefone',
  'whatsapp',
  'instagram',
  'site',
  'nicho',
  'oportunidade',
  'score',
  'observacao_comercial',
  'status',
  'origem',
] as const

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

function leadFromRow(row: LeadRow): OrigamiLead {
  return {
    id: String(row.id),
    nomeNegocio: String(row.nome_negocio ?? ''),
    nomeDono: textOrNull(row.nome_dono),
    cidade: String(row.cidade ?? ''),
    googleMapsUrl: textOrNull(row.google_maps_url),
    telefone: textOrNull(row.telefone),
    whatsapp: textOrNull(row.whatsapp),
    instagram: textOrNull(row.instagram),
    site: textOrNull(row.site),
    nicho: String(row.nicho ?? ''),
    oportunidade: String(row.oportunidade ?? ''),
    score: Number(row.score ?? 1),
    observacaoComercial: textOrNull(row.observacao_comercial),
    status: ORIGAMI_LEAD_STATUSES.includes(row.status as OrigamiLeadStatus) ? row.status as OrigamiLeadStatus : 'novo',
    origem: textOrNull(row.origem),
    createdAt: textOrNull(row.created_at),
    updatedAt: textOrNull(row.updated_at),
  }
}

function leadToRow(input: OrigamiLeadInput | Partial<OrigamiLeadInput>) {
  const row: Record<string, unknown> = {}
  if ('nomeNegocio' in input) row.nome_negocio = input.nomeNegocio
  if ('nomeDono' in input) row.nome_dono = input.nomeDono
  if ('cidade' in input) row.cidade = input.cidade
  if ('googleMapsUrl' in input) row.google_maps_url = input.googleMapsUrl
  if ('telefone' in input) row.telefone = input.telefone
  if ('whatsapp' in input) row.whatsapp = input.whatsapp
  if ('instagram' in input) row.instagram = input.instagram
  if ('site' in input) row.site = input.site
  if ('nicho' in input) row.nicho = input.nicho
  if ('oportunidade' in input) row.oportunidade = input.oportunidade
  if ('score' in input) row.score = input.score
  if ('observacaoComercial' in input) row.observacao_comercial = input.observacaoComercial
  if ('status' in input) row.status = input.status
  if ('origem' in input) row.origem = input.origem
  return row
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
    .from('leads_origami')
    .select('*')
    .order('created_at', { ascending: false })
  assertNoError(error)
  return (data ?? []).map((row) => leadFromRow(row as LeadRow))
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
      const { error } = await client.from('leads_origami').insert(leadToRow(row.input))
      assertNoError(error)
      summary.created += 1
      continue
    }
    if (row.action === 'atualizar' && row.existing && row.updatePatch) {
      const { error } = await client.from('leads_origami').update(leadToRow(row.updatePatch)).eq('id', row.existing.id)
      assertNoError(error)
      summary.updated += 1
    }
  }

  return { rows, summary }
}

export async function updateOrigamiLeadStatus(id: string, status: OrigamiLeadStatus) {
  const { data, error } = await requireSupabase()
    .from('leads_origami')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  assertNoError(error)
  return leadFromRow(data as LeadRow)
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

export const origamiLeadDbFields = dbFields
