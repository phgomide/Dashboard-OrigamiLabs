import { describe, expect, it } from 'vitest'
import { lossDistribution, projectConversion, sourceDistribution } from './analytics'
import type { Lead } from '../types'

const lead = (overrides: Partial<Lead>): Lead => ({
  id: crypto.randomUUID(),
  businessName: 'Lead',
  niche: 'Serviços',
  source: 'Instagram',
  city: 'São Paulo',
  projectInterest: 'Origami Sites',
  pipelineStatus: 'Novo lead',
  temperature: 'Morno',
  priority: 'Média',
  estimatedValue: 1000,
  paymentStatus: 'Não se aplica',
  createdAt: '2026-06-01',
  updatedAt: '2026-06-01',
  ...overrides,
})

describe('analytics helpers', () => {
  it('calculates lead source distribution from real lead rows', () => {
    const data = sourceDistribution([lead({ source: 'Instagram' }), lead({ source: 'Instagram' }), lead({ source: 'Indicação' })])

    expect(data[0]).toMatchObject({ name: 'Instagram', count: 2, value: 67 })
    expect(data[1]).toMatchObject({ name: 'Indicação', count: 1, value: 33 })
  })

  it('calculates project conversion per offer', () => {
    const data = projectConversion([
      lead({ projectInterest: 'Origami Sites', pipelineStatus: 'Fechado' }),
      lead({ projectInterest: 'Origami Sites', pipelineStatus: 'Perdido' }),
      lead({ projectInterest: 'Origami Agenda', pipelineStatus: 'Fechado' }),
    ])

    expect(data.find((item) => item.name === 'Origami Sites')).toMatchObject({ total: 2, closed: 1, value: 50 })
    expect(data.find((item) => item.name === 'Origami Agenda')).toMatchObject({ total: 1, closed: 1, value: 100 })
  })

  it('uses lost reasons for loss reports', () => {
    const data = lossDistribution([
      lead({ pipelineStatus: 'Perdido', lostReason: 'Sem retorno' }),
      lead({ pipelineStatus: 'Perdido', lostReason: 'Sem retorno' }),
      lead({ pipelineStatus: 'Perdido', lostReason: 'Momento financeiro' }),
      lead({ pipelineStatus: 'Fechado' }),
    ])

    expect(data[0]).toMatchObject({ name: 'Sem retorno', count: 2, value: 67 })
  })
})
