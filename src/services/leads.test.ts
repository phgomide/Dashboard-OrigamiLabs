import { describe, expect, it } from 'vitest'
import type { Lead } from '../types'
import { cleanupDuplicateLeadsLocal, countCleanupEligibleDuplicateExtras, countDuplicateExtras, findDuplicateLeadGroups } from './leads'

const baseLead = (id: string, patch: Partial<Lead> = {}): Lead => ({
  id,
  businessName: `Negocio ${id}`,
  niche: 'Restaurante',
  source: 'Teste',
  city: 'Joao Pessoa',
  projectInterest: 'Cardapio Digital',
  pipelineStatus: 'Novo lead',
  temperature: 'Morno',
  priority: 'Média',
  estimatedValue: 0,
  paymentStatus: 'Não se aplica',
  createdAt: `2026-07-0${id}T10:00:00Z`,
  updatedAt: `2026-07-0${id}T10:00:00Z`,
  ...patch,
})

describe('lead duplicate helpers', () => {
  it('detects duplicated leads by Google Maps, phone and name/city', () => {
    const leads = [
      baseLead('1', { businessName: 'Padaria Central', googleMapsUrl: 'https://maps.google.com/?cid=1' }),
      baseLead('2', { businessName: 'Padaria Central', googleMapsUrl: 'https://maps.google.com/?cid=1' }),
      baseLead('3', { businessName: 'Clinica Sol', phone: '(83) 99999-0000' }),
      baseLead('4', { businessName: 'Outro nome', whatsapp: '5583999990000' }),
      baseLead('5', { businessName: 'Studio Zen', city: 'Cabedelo' }),
      baseLead('6', { businessName: 'Studio   Zen', city: 'cabedelo' }),
    ]

    const groups = findDuplicateLeadGroups(leads)
    expect(groups.map((group) => group.label)).toEqual(expect.arrayContaining(['Google Maps', 'telefone/WhatsApp', 'nome + cidade']))
    expect(countDuplicateExtras(groups)).toBe(3)
    expect(countCleanupEligibleDuplicateExtras(groups)).toBe(0)
  })

  it('keeps the richer lead when cleaning duplicates locally', () => {
    const leads = [
      baseLead('1', { businessName: 'Padaria Central', phone: '83999990000', automationDedupeKey: 'maps:abc' }),
      baseLead('2', { businessName: 'Padaria Central', whatsapp: '5583999990000', instagram: '@padaria', automationDedupeKey: 'maps:abc' }),
    ]

    const result = cleanupDuplicateLeadsLocal(leads)
    expect(result.deletedCount).toBe(1)
    expect(result.leads).toHaveLength(1)
    expect(result.leads[0].id).toBe('2')
  })

  it('does not delete broad possible duplicates without automation key', () => {
    const leads = [
      baseLead('1', { businessName: 'Padaria Central', phone: '83999990000' }),
      baseLead('2', { businessName: 'Padaria Central', whatsapp: '5583999990000', instagram: '@padaria' }),
    ]

    const result = cleanupDuplicateLeadsLocal(leads)
    expect(result.deletedCount).toBe(0)
    expect(result.leads).toHaveLength(2)
  })
})
