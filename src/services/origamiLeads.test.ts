import { describe, expect, it } from 'vitest'
import type { OrigamiLead } from '../types'
import { buildOrigamiLeadPreview, normalizeOrigamiLead, parseOrigamiLeadJson, previewSummary } from './origamiLeads'

const existingLead: OrigamiLead = {
  id: 'lead-1',
  nomeNegocio: 'Padaria Central',
  nomeDono: null,
  cidade: 'Belo Horizonte',
  googleMapsUrl: 'https://maps.google.com/padaria',
  telefone: null,
  whatsapp: '31999990000',
  instagram: null,
  site: null,
  nicho: 'Alimentacao',
  oportunidade: 'Site institucional',
  score: 4,
  observacaoComercial: null,
  status: 'novo',
  origem: 'pesquisa_manual_json',
  createdAt: null,
  updatedAt: null,
}

describe('origami lead import helpers', () => {
  it('accepts a single object and an array', () => {
    expect(parseOrigamiLeadJson('{"nome_negocio":"A"}')).toHaveLength(1)
    expect(parseOrigamiLeadJson('[{"nome_negocio":"A"},{"nome_negocio":"B"}]')).toHaveLength(2)
  })

  it('normalizes empty optional fields to null', () => {
    const normalized = normalizeOrigamiLead({
      nome_negocio: 'Clinica Luz',
      cidade: 'Contagem',
      nicho: 'Saude',
      oportunidade: 'Landing page',
      score: 5,
      telefone: '',
      instagram: '   ',
    })

    expect(normalized.errors).toEqual([])
    expect(normalized.input?.telefone).toBeNull()
    expect(normalized.input?.instagram).toBeNull()
  })

  it('rejects missing required fields and invalid scores', () => {
    const normalized = normalizeOrigamiLead({ nome_negocio: '', cidade: 'BH', nicho: 'Moda', oportunidade: 'Site', score: 9 })

    expect(normalized.input).toBeUndefined()
    expect(normalized.errors).toContain('nome_negocio e obrigatorio.')
    expect(normalized.errors).toContain('score precisa ser um numero inteiro entre 1 e 5.')
  })

  it('updates only empty fields by default on duplicates', () => {
    const rows = buildOrigamiLeadPreview([{
      nome_negocio: 'Padaria Central',
      cidade: 'Belo Horizonte',
      google_maps_url: 'https://maps.google.com/padaria',
      telefone: '3133334444',
      whatsapp: '31999990000',
      instagram: '@padariacentral',
      nicho: 'Outro nicho',
      oportunidade: 'Outro projeto',
      score: 5,
    }], [existingLead])

    expect(rows[0].action).toBe('atualizar')
    expect(rows[0].updatePatch).toEqual({ telefone: '3133334444', instagram: '@padariacentral' })
  })

  it('can overwrite existing data when explicitly requested', () => {
    const rows = buildOrigamiLeadPreview([{
      nome_negocio: 'Padaria Central',
      cidade: 'Belo Horizonte',
      whatsapp: '31999990000',
      nicho: 'Alimentacao premium',
      oportunidade: 'Catalogo digital',
      score: 5,
    }], [existingLead], true)

    expect(rows[0].action).toBe('atualizar')
    expect(rows[0].updatePatch).toMatchObject({ nicho: 'Alimentacao premium', oportunidade: 'Catalogo digital', score: 5 })
  })

  it('summarizes preview actions', () => {
    const rows = buildOrigamiLeadPreview([
      { nome_negocio: 'Novo', cidade: 'BH', nicho: 'Moda', oportunidade: 'Site', score: 3 },
      { nome_negocio: '', cidade: 'BH', nicho: 'Moda', oportunidade: 'Site', score: 3 },
    ], [])

    expect(previewSummary(rows)).toEqual({ created: 1, updated: 0, ignored: 0, errors: 1 })
  })
})
