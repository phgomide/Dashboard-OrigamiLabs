import { describe, expect, it } from 'vitest'
import { buildWhatsAppUrl, safeExternalUrl, safeInstagramUrl } from './leadLinks'

describe('lead link safety helpers', () => {
  it('builds a WhatsApp URL with the personalized message when needed', () => {
    const url = buildWhatsAppUrl('(83) 99999-0000', undefined, 'Olá!\nVi o perfil do negócio.')
    expect(url).toContain('https://wa.me/5583999990000?text=')
    expect(url).toContain('%C3%A1')
  })

  it('does not trust unsafe external schemes', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBe('')
    expect(safeExternalUrl('https://example.com')).toBe('https://example.com')
    expect(safeInstagramUrl('javascript:alert(1)')).toBe('')
    expect(safeInstagramUrl('@origami')).toBe('https://instagram.com/origami')
  })

  it('adds text to a valid existing WhatsApp URL when absent', () => {
    const url = buildWhatsAppUrl(undefined, 'https://wa.me/5583999990000', 'Mensagem')
    expect(url).toContain('text=Mensagem')
  })
})
