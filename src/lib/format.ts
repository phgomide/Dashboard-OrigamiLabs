export const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export const shortDate = (date?: string) => {
  if (!date) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(date))
}

export const initials = (name: string) => name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
