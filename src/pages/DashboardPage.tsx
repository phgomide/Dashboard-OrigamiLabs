import { ArrowRight, ArrowUpRight, CalendarClock, CircleDollarSign, Flame, Target, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { currency, shortDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { Badge, Button } from '../components/ui'
import { useNavigate } from 'react-router-dom'

const tooltipStyle = { borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 12px 35px rgba(17,24,39,.10)', fontSize: 12 }
const colors = ['#5B7CFF', '#7C5CFF', '#22A06B', '#F59E0B', '#EC4899', '#64748B']
const monthName = (date: string) => new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${date}T00:00:00`)).replace('.', '')
const percent = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0
const dateOnly = (date?: string) => (date ?? '').slice(0, 10)

export function DashboardPage() {
  const { leads, activities, proposals } = useAppStore()
  const navigate = useNavigate()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const closed = leads.filter((lead) => lead.pipelineStatus === 'Fechado')
  const lost = leads.filter((lead) => lead.pipelineStatus === 'Perdido')
  const future = leads.filter((lead) => lead.pipelineStatus === 'Futuro')
  const active = leads.filter((lead) => !['Fechado', 'Perdido', 'Futuro'].includes(lead.pipelineStatus))
  const expectedRevenue = leads.filter((lead) => !['Perdido', 'Fechado'].includes(lead.pipelineStatus)).reduce((sum, lead) => sum + lead.estimatedValue, 0)
  const closedRevenue = closed.reduce((sum, lead) => sum + (lead.finalValue ?? lead.estimatedValue), 0)
  const averageTicket = closed.length ? closedRevenue / closed.length : 0
  const closeRate = leads.length ? (closed.length / leads.length) * 100 : 0
  const priorityToday = activities.filter((activity) => activity.status !== 'Concluída' && (activity.date <= today || activity.priority === 'Alta')).length
  const meetingsToday = activities.filter((activity) => activity.date === today && activity.type === 'Reunião')
  const stalledLeads = leads.filter((lead) => !['Fechado', 'Perdido'].includes(lead.pipelineStatus) && dateOnly(lead.updatedAt) < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const leadTrend = Array.from(leads.reduce((map, lead) => {
    const month = monthName(dateOnly(lead.createdAt) || today)
    map.set(month, (map.get(month) ?? 0) + 1)
    return map
  }, new Map<string, number>()), ([month, count]) => ({ month, leads: count })).slice(-6)
  const revenueTrend = Array.from(leads.reduce((map, lead) => {
    const month = monthName(dateOnly(lead.closedAt || lead.createdAt) || today)
    const current = map.get(month) ?? { month, prevista: 0, fechada: 0 }
    if (lead.pipelineStatus === 'Fechado') current.fechada += lead.finalValue ?? lead.estimatedValue
    else if (lead.pipelineStatus !== 'Perdido') current.prevista += lead.estimatedValue
    map.set(month, current)
    return map
  }, new Map<string, { month: string; prevista: number; fechada: number }>()), ([, value]) => value).slice(-6)
  const projectMix = Array.from(leads.reduce((map, lead) => {
    map.set(lead.projectInterest, (map.get(lead.projectInterest) ?? 0) + 1)
    return map
  }, new Map<string, number>()), ([name, count], index) => ({ name, value: percent(count, leads.length), color: colors[index % colors.length] })).slice(0, 5)
  const sourceMix = Array.from(leads.reduce((map, lead) => {
    map.set(lead.source, (map.get(lead.source) ?? 0) + 1)
    return map
  }, new Map<string, number>()), ([name, count]) => ({ name, value: percent(count, leads.length) })).slice(0, 5)
  const metrics = [
    { label: 'Leads ativos', value: active.length, note: `${leads.length} leads totais`, icon: Users },
    { label: 'Receita prevista', value: currency.format(expectedRevenue), note: `${proposals.filter((proposal) => !['Aceita', 'Recusada'].includes(proposal.status)).length} propostas abertas`, icon: Target },
    { label: 'Receita fechada', value: currency.format(closedRevenue), note: `${closed.length} clientes fechados`, icon: CircleDollarSign },
    { label: 'Taxa de fechamento', value: `${closeRate.toFixed(1)}%`, note: `${lost.length} perdidos`, icon: Flame },
  ]
  const hotLeads = leads.filter((lead) => lead.temperature === 'Quente' && lead.pipelineStatus !== 'Fechado').slice(0, 4)
  const upcoming = activities.filter((activity) => activity.status !== 'Concluída').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 4)

  return <div className="page dashboard-page">
    <section className="page-heading"><div><span className="eyebrow">{dateLabel}</span><h1>Bom dia, Origami.</h1><p>A operação tem <strong>{priorityToday} ações prioritárias</strong> para acompanhar.</p></div><div className="page-heading__actions"><Button variant="secondary" onClick={() => navigate('/agenda')}><CalendarClock size={17} />Ver agenda</Button><Button onClick={() => navigate('/pipeline')}>Abrir pipeline<ArrowRight size={17} /></Button></div></section>
    <section className="metric-grid" aria-label="Resumo comercial">{metrics.map(({ label, value, note, icon: Icon }) => <article className="metric-card" key={label}><div className="metric-card__top"><span>{label}</span><span className="metric-card__icon"><Icon size={18} /></span></div><strong>{value}</strong><small className="positive"><ArrowUpRight size={14} />{note}</small></article>)}</section>
    <section className="dashboard-grid">
      <article className="panel panel--revenue"><header className="panel__header"><div><span className="eyebrow">Performance comercial</span><h2>Receita prevista vs. fechada</h2></div><select aria-label="Período do gráfico"><option>Últimos registros</option><option>Este ano</option></select></header><div className="chart-summary"><div><span>Receita fechada</span><strong>{currency.format(closedRevenue)}</strong><small className="positive"><ArrowUpRight size={14} />{closed.length} clientes</small></div><div><span>Em negociação</span><strong>{currency.format(expectedRevenue)}</strong></div></div><div className="chart" role="img" aria-label="Gráfico de receita prevista e fechada por mês."><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueTrend} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}><defs><linearGradient id="expected" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C5CFF" stopOpacity=".18" /><stop offset="1" stopColor="#7C5CFF" stopOpacity="0" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F4" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8B93A2', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8B93A2', fontSize: 11 }} tickFormatter={(value) => `${Number(value) / 1000}k`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => currency.format(Number(value))} /><Area type="monotone" dataKey="prevista" stroke="#B3A4FF" fill="url(#expected)" strokeWidth={2} /><Area type="monotone" dataKey="fechada" stroke="#5B7CFF" fill="transparent" strokeWidth={3} /></AreaChart></ResponsiveContainer></div><div className="chart-legend"><span><i className="dot dot--blue" />Fechada</span><span><i className="dot dot--purple" />Prevista</span></div></article>
      <article className="panel panel--actions"><header className="panel__header"><div><span className="eyebrow">Foco do dia</span><h2>Próximas ações</h2></div><button className="text-button" onClick={() => navigate('/agenda')}>Ver todas</button></header><div className="action-list">{upcoming.map((activity) => { const related = leads.find((lead) => lead.id === activity.leadId); return <div className="action-item" key={activity.id}><div className={`timeline-dot timeline-dot--${activity.priority.toLowerCase().replace('é', 'e')}`} /><div><strong>{activity.title}</strong><span>{related?.businessName}</span></div><time>{activity.date === today ? 'Hoje' : shortDate(activity.date)}<small>{activity.time}</small></time></div> })}</div><Button variant="secondary" className="panel__full-button" onClick={() => navigate('/agenda')}>Organizar meu dia<ArrowRight size={16} /></Button></article>
      <article className="panel panel--leads"><header className="panel__header"><div><span className="eyebrow">Aquisição</span><h2>Evolução de leads</h2></div><Badge tone="success">{leads.length}</Badge></header><div className="small-chart" role="img" aria-label="Gráfico de leads criados por mês."><ResponsiveContainer width="100%" height="100%"><BarChart data={leadTrend}><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8B93A2', fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F5F7FA' }} /><Bar dataKey="leads" fill="#5B7CFF" radius={[5, 5, 2, 2]} /></BarChart></ResponsiveContainer></div></article>
      <article className="panel panel--mix"><header className="panel__header"><div><span className="eyebrow">Mix de oferta</span><h2>Projetos procurados</h2></div></header><div className="donut-wrap"><div className="donut-chart" role="img" aria-label="Distribuição dos tipos de projeto procurados."><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={projectMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3}>{projectMix.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value}%`} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{leads.length}</strong><span>interesses</span></div></div><div className="mix-list">{projectMix.map((item) => <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div></div></article>
      <article className="panel panel--hot"><header className="panel__header"><div><span className="eyebrow">Prioridade</span><h2>Leads mais quentes</h2></div><button className="text-button" onClick={() => navigate('/leads')}>Ver leads</button></header><div className="hot-list">{hotLeads.map((lead) => <button key={lead.id} onClick={() => navigate('/pipeline')}><span className="business-avatar">{lead.businessName.slice(0, 2).toUpperCase()}</span><span><strong>{lead.businessName}</strong><small>{lead.projectInterest}</small></span><span className="hot-list__value"><strong>{currency.format(lead.estimatedValue)}</strong><small>{lead.pipelineStatus}</small></span><ArrowRight size={16} /></button>)}</div></article>
      <article className="panel panel--sources"><header className="panel__header"><div><span className="eyebrow">Canais</span><h2>Origem dos leads</h2></div></header><div className="source-bars">{sourceMix.map((source, index) => <div key={source.name}><span>{source.name}</span><div><i style={{ width: `${source.value}%`, opacity: 1 - index * .12 }} /></div><strong>{source.value}%</strong></div>)}</div><div className="source-insight"><Target size={17} /><span><strong>{sourceMix[0]?.name ?? 'Origem'}</strong><small>é o canal com maior volume registrado.</small></span></div></article>
    </section>
    <section className="micro-metrics"><div><span>Total de leads</span><strong>{leads.length}</strong></div><div><span>Reuniões de hoje</span><strong>{meetingsToday.length}</strong></div><div><span>Ticket médio</span><strong>{currency.format(averageTicket)}</strong></div><div><span>Oportunidades futuras</span><strong>{future.length}</strong></div><div><span>Leads parados</span><strong className="warning-text">{stalledLeads.length}</strong></div></section>
  </div>
}
