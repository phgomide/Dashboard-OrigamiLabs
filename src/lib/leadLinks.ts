const isSafeHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
  } catch {
    return false
  }
}

export function safeExternalUrl(value?: string | null) {
  if (!value) return ''
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return isSafeHttpUrl(candidate) ? candidate : ''
}

export function safeInstagramUrl(value?: string | null) {
  if (!value) return ''
  if (!/^https?:\/\//i.test(value) && !/^@?[A-Za-z0-9._]+$/.test(value.replace(/^instagram\.com\//i, ''))) return ''
  const candidate = /^https?:\/\//i.test(value) ? value : `https://instagram.com/${value.replace(/^@/, '').replace(/^instagram\.com\//i, '')}`
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'instagram.com' && !url.username && !url.password ? url.toString() : ''
  } catch {
    return ''
  }
}

export function buildWhatsAppUrl(phone?: string | null, existingUrl?: string | null, message?: string | null) {
  if (existingUrl && /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(existingUrl) && isSafeHttpUrl(existingUrl)) {
    try {
      const url = new URL(existingUrl)
      if (url.hostname.toLowerCase() === 'wa.me' || url.hostname.toLowerCase() === 'api.whatsapp.com') {
        if (message && !url.searchParams.has('text')) url.searchParams.set('text', message)
        return url.toString()
      }
    } catch {
      // Fall through to rebuilding from the phone number.
    }
  }
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!digits) return ''
  const normalized = digits.startsWith('55') ? digits : `55${digits}`
  const url = new URL(`https://wa.me/${normalized}`)
  if (message?.trim()) url.searchParams.set('text', message)
  return url.toString()
}
