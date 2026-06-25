import type { Activity, Lead, Project } from '../types'

const palette = ['#5B7CFF', '#7C5CFF', '#22A06B', '#F59E0B', '#EC4899', '#64748B']

const asDate = (value?: string) => value ? new Date(`${value.slice(0, 10)}T00:00:00`) : null
const monthKey = (value?: string) => value?.slice(0, 7) ?? ''
const currentMonth = () => new Date().toISOString().slice(0, 7)
const percent = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0

function countBy<T>(items: T[], key: (item: T) => string | undefined) {
  const counts = new Map<string, number>()
  items.forEach((item) => {
    const name = key(item)?.trim() || 'Nao informado'
    counts.set(name, (counts.get(name) ?? 0) + 1)
  })
  return counts
}

export function distribution(items: string[], total: number) {
  return Array.from(countBy(items, (item) => item), ([name, count], index) => ({
    name,
    count,
    value: percent(count, total),
    color: palette[index % palette.length],
  })).sort((a, b) => b.count - a.count)
}

export function sourceDistribution(leads: Lead[]) {
  return distribution(leads.map((lead) => lead.source), leads.length).slice(0, 6)
}

export function projectDemand(leads: Lead[]) {
  return distribution(leads.map((lead) => lead.projectInterest), leads.length).slice(0, 6)
}

export function projectConversion(leads: Lead[]) {
  const groups = new Map<string, { total: number; closed: number }>()
  leads.forEach((lead) => {
    const name = lead.projectInterest || 'Nao informado'
    const current = groups.get(name) ?? { total: 0, closed: 0 }
    current.total += 1
    if (lead.pipelineStatus === 'Fechado') current.closed += 1
    groups.set(name, current)
  })
  return Array.from(groups, ([name, item], index) => ({
    name,
    total: item.total,
    closed: item.closed,
    value: percent(item.closed, item.total),
    color: palette[index % palette.length],
  })).sort((a, b) => b.value - a.value || b.total - a.total)
}

export function lossDistribution(leads: Lead[]) {
  const lost = leads.filter((lead) => lead.pipelineStatus === 'Perdido')
  return distribution(lost.map((lead) => lead.lostReason ?? 'Sem motivo informado'), lost.length)
}

export function revenueByProject(projects: Project[]) {
  const totals = new Map<string, number>()
  projects.forEach((project) => totals.set(project.projectType, (totals.get(project.projectType) ?? 0) + project.value))
  const total = projects.reduce((sum, project) => sum + project.value, 0)
  return Array.from(totals, ([name, amount], index) => ({
    name,
    amount,
    value: percent(amount, total),
    color: palette[index % palette.length],
  })).sort((a, b) => b.amount - a.amount)
}

export function monthlyRevenueStatus(projects: Project[]) {
  const month = currentMonth()
  const monthProjects = projects.filter((project) => monthKey(project.startedAt) === month || monthKey(project.deadline) === month)
  const closed = monthProjects.reduce((sum, project) => sum + project.value, 0)
  const received = monthProjects.filter((project) => project.paymentStatus === 'Pago').reduce((sum, project) => sum + project.value, 0)
  const pending = monthProjects.filter((project) => project.paymentStatus !== 'Pago').reduce((sum, project) => sum + project.value, 0)
  return { closed, received, pending, percentReceived: percent(received, closed), count: monthProjects.length }
}

export function reportInsight(leads: Lead[]) {
  const bySource = new Map<string, { total: number; closed: number }>()
  leads.forEach((lead) => {
    const name = lead.source || 'Nao informado'
    const current = bySource.get(name) ?? { total: 0, closed: 0 }
    current.total += 1
    if (lead.pipelineStatus === 'Fechado') current.closed += 1
    bySource.set(name, current)
  })
  const best = Array.from(bySource, ([name, item]) => ({ name, ...item, rate: percent(item.closed, item.total) }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.rate - a.rate || b.closed - a.closed)[0]
  if (!best) return { title: 'Dados em formacao', description: 'Cadastre leads e projetos para revelar os canais e ofertas com melhor conversao.' }
  return {
    title: `${best.name} esta performando melhor`,
    description: `${best.rate}% dos leads desse canal viraram cliente. Priorize acoes parecidas e registre novos follow-ups.`,
  }
}

export function funnelHealth(leads: Lead[], activities: Activity[]) {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  const active = leads.filter((lead) => !['Fechado', 'Perdido'].includes(lead.pipelineStatus))
  const withoutAction = active.filter((lead) => !lead.nextActionDate).length
  const overdue = activities.filter((activity) => activity.status !== 'Concluída' && asDate(activity.date) && asDate(activity.date)! < today).length
  const stalled = active.filter((lead) => {
    const updated = asDate(lead.updatedAt)
    return updated ? updated < sevenDaysAgo : false
  }).length
  const future = leads.filter((lead) => lead.pipelineStatus === 'Futuro').length
  const hot = leads.filter((lead) => lead.temperature === 'Quente' && lead.pipelineStatus !== 'Fechado').length
  return { withoutAction, overdue, stalled, future, hot }
}
