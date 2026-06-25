import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, ListFilter, MoreHorizontal, Plus, Target, TrendingUp, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge, Button, ConfirmDialog, Modal } from '../components/ui'
import { funnelHealth, lossDistribution, projectConversion, reportInsight, revenueByProject, sourceDistribution } from '../lib/analytics'
import { currency, shortDate } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import * as settingsService from '../services/settings'
import { useAppStore } from '../store/useAppStore'
import type { Activity, Lead, PaymentStatus, Project, Proposal } from '../types'

const activityTypes: Activity['type'][] = ['Primeiro contato', 'Reunião', 'Follow-up', 'Envio de proposta', 'Revisão', 'Cobrança', 'Entrega', 'Retomada']
const activityStatuses: Activity['status'][] = ['Pendente', 'Concluída', 'Atrasada', 'Cancelada']
const priorities: Activity['priority'][] = ['Alta', 'Média', 'Baixa']
const proposalStatuses: Proposal['status'][] = ['Rascunho', 'Enviada', 'Em negociação', 'Aceita', 'Recusada', 'Expirada']
const projectStatuses: Project['status'][] = ['Aguardando início', 'Em desenvolvimento', 'Revisão', 'Ajustes finais', 'Entregue', 'Pausado', 'Cancelado']
const projectStages: Project['currentStage'][] = ['Briefing', 'Estrutura', 'Design', 'Desenvolvimento', 'Revisão', 'Publicação', 'Entrega final']
const paymentStatuses: PaymentStatus[] = ['Não se aplica', 'Pendente', 'Parcial', 'Pago']
const settingCategories = ['Tipos de projeto','Planos','Nichos','Origens de lead','Status do pipeline','Prioridades','Temperaturas','Motivos de perda','Status de projeto','Status de pagamento']
const settingColors = ['#5B7CFF','#7C5CFF','#22A06B','#F59E0B','#EC4899','#64748B']
const settingDefaults: Record<string, string[]> = {
  'Tipos de projeto': ['Origami Sites','Origami Agenda','Origami Organize','Site + Agenda','Agenda + Organize','Projeto personalizado'],
  Planos: ['Essencial','Presença completa','Operação Pro','Projeto sob medida'],
  Nichos: ['Petshop','Psicologia','Barbearia','Floricultura','Assistência técnica','Alimentação'],
  'Origens de lead': ['Instagram','Indicação','Google','Prospecção','Evento local','LinkedIn'],
  'Status do pipeline': ['Novo lead','Primeiro contato','Conversando','Reunião marcada','Diagnóstico feito','Proposta enviada','Negociação','Fechado','Perdido','Futuro'],
  Prioridades: ['Alta','Média','Baixa'],
  Temperaturas: ['Quente','Morno','Frio'],
  'Motivos de perda': ['Momento financeiro','Sem prioridade','Escolheu concorrente','Sem retorno'],
  'Status de projeto': ['Aguardando início','Em desenvolvimento','Revisão','Ajustes finais','Entregue','Pausado','Cancelado'],
  'Status de pagamento': ['Pendente','Parcial','Pago'],
}

const chartTooltip = { borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(17,24,39,.1)', fontSize: 11 }
const today = () => new Date().toISOString().slice(0, 10)
const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}
const tone = (value: string) => value.includes('Pago') || value.includes('Aceita') || value.includes('Concluída') || value.includes('Entregue') ? 'success' : value.includes('Recusada') || value.includes('Atrasada') || value.includes('Cancelado') ? 'danger' : value.includes('Pendente') || value.includes('negociação') || value.includes('Ajustes') ? 'warning' : 'primary'
const leadName = (leads: Lead[], id: string) => leads.find((lead) => lead.id === id)?.businessName ?? 'Lead sem vínculo'
const monthLabel = (date: string) => new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${date}T00:00:00`)).replace('.', '')
const projectProgress = (project: Project) => {
  const index = projectStages.indexOf(project.currentStage)
  if (project.status === 'Entregue') return 100
  if (project.status === 'Cancelado') return 0
  return Math.max(12, Math.round(((index + 1) / projectStages.length) * 100))
}

function PageTitle({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action?: string; onAction?: () => void }) {
  return <section className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action && <Button onClick={onAction}><Plus size={17} />{action}</Button>}</section>
}

function ActivityForm({ activity, leads, onClose }: { activity?: Activity; leads: Lead[]; onClose: () => void }) {
  const { addActivity, updateActivity, deleteActivity } = useAppStore()
  const [form, setForm] = useState<Activity>(activity ?? { id: crypto.randomUUID(), leadId: leads[0]?.id ?? '', title: '', type: 'Follow-up', date: today(), time: '09:00', status: 'Pendente', priority: 'Média', description: '' })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) return
    if (activity) await updateActivity(form)
    else await addActivity({ ...form, id: crypto.randomUUID() })
    onClose()
  }
  return <Modal title={activity ? 'Editar ação' : 'Nova ação'} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <label className="form-field form-field--wide">Título *<input autoFocus required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Confirmar proposta enviada" /></label>
    <label className="form-field">Lead<select value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })}>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.businessName}</option>)}</select></label>
    <label className="form-field">Tipo<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Activity['type'] })}>{activityTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-field">Data<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
    <label className="form-field">Hora<input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></label>
    <label className="form-field">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Activity['status'] })}>{activityStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-field">Prioridade<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Activity['priority'] })}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-field form-field--wide">Descrição<textarea rows={4} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
    <div className="form-actions">{activity && <Button type="button" variant="danger" onClick={() => setConfirmingDelete(true)}>Excluir</Button>}<Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar ação</Button></div>
    {confirmingDelete && activity && <ConfirmDialog title="Remover ação?" description={`A ação "${activity.title}" será removida da agenda.`} onCancel={() => setConfirmingDelete(false)} onConfirm={async () => { await deleteActivity(activity.id); onClose() }} />}
  </form></Modal>
}

function ProposalForm({ proposal, leads, onClose }: { proposal?: Proposal; leads: Lead[]; onClose: () => void }) {
  const { addProposal, updateProposal, deleteProposal } = useAppStore()
  const [form, setForm] = useState<Proposal>(proposal ?? { id: crypto.randomUUID(), leadId: leads[0]?.id ?? '', projectType: leads[0]?.projectInterest ?? 'Origami Sites', planName: 'Essencial', value: leads[0]?.estimatedValue ?? 897, status: 'Rascunho', sentAt: today(), validUntil: addDays(today(), 10), probability: 50, notes: '' })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.leadId || !form.projectType.trim()) return
    if (proposal) await updateProposal(form)
    else await addProposal({ ...form, id: crypto.randomUUID() })
    onClose()
  }
  return <Modal title={proposal ? 'Editar proposta' : 'Nova proposta'} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <label className="form-field form-field--wide">Lead<select value={form.leadId} onChange={(e) => { const lead = leads.find((item) => item.id === e.target.value); setForm({ ...form, leadId: e.target.value, projectType: lead?.projectInterest ?? form.projectType, value: lead?.estimatedValue ?? form.value }) }}>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.businessName}</option>)}</select></label>
    <label className="form-field">Projeto<input required value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} /></label>
    <label className="form-field">Plano<input required value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} /></label>
    <label className="form-field">Valor<input type="number" min="0" step="1" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></label>
    <label className="form-field">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Proposal['status'] })}>{proposalStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-field">Envio<input type="date" value={form.sentAt ?? ''} onChange={(e) => setForm({ ...form, sentAt: e.target.value })} /></label>
    <label className="form-field">Validade<input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></label>
    <label className="form-field form-field--wide">Probabilidade<input type="range" min="0" max="100" value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} /><span>{form.probability}%</span></label>
    <label className="form-field form-field--wide">Notas<textarea rows={4} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
    <div className="form-actions">{proposal && <Button type="button" variant="danger" onClick={() => setConfirmingDelete(true)}>Excluir</Button>}<Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar proposta</Button></div>
    {confirmingDelete && proposal && <ConfirmDialog title="Remover proposta?" description={`A proposta ${proposal.planName} será removida do histórico comercial.`} onCancel={() => setConfirmingDelete(false)} onConfirm={async () => { await deleteProposal(proposal.id); onClose() }} />}
  </form></Modal>
}

function ProjectForm({ project, leads, onClose }: { project?: Project; leads: Lead[]; onClose: () => void }) {
  const { addProject, updateProject, deleteProject } = useAppStore()
  const closedLeads = leads.filter((lead) => lead.pipelineStatus === 'Fechado')
  const eligibleLeads = closedLeads.length ? closedLeads : leads
  const firstLead = eligibleLeads[0]
  const [form, setForm] = useState<Project>(project ?? { id: crypto.randomUUID(), leadId: firstLead?.id ?? '', projectType: firstLead?.projectInterest ?? 'Origami Sites', value: firstLead?.finalValue ?? firstLead?.estimatedValue ?? 897, status: 'Aguardando início', currentStage: 'Briefing', paymentStatus: 'Pendente', startedAt: today(), deadline: addDays(today(), 21), notes: '' })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.leadId || !form.projectType.trim()) return
    if (project) await updateProject(form)
    else await addProject({ ...form, id: crypto.randomUUID() })
    onClose()
  }
  return <Modal title={project ? 'Editar projeto' : 'Novo projeto'} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <label className="form-field form-field--wide">Lead fechado<select value={form.leadId} onChange={(e) => { const lead = leads.find((item) => item.id === e.target.value); setForm({ ...form, leadId: e.target.value, projectType: lead?.projectInterest ?? form.projectType, value: lead?.finalValue ?? lead?.estimatedValue ?? form.value }) }}>{eligibleLeads.map((lead) => <option key={lead.id} value={lead.id}>{lead.businessName}</option>)}</select></label>
    <label className="form-field">Projeto<input required value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} /></label>
    <label className="form-field">Valor<input type="number" min="0" step="1" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></label>
    <label className="form-field">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Project['status'] })}>{projectStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-field">Etapa<select value={form.currentStage} onChange={(e) => setForm({ ...form, currentStage: e.target.value as Project['currentStage'] })}>{projectStages.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-field">Pagamento<select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}>{paymentStatuses.filter((item) => item !== 'Não se aplica').map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-field">Início<input type="date" value={form.startedAt} onChange={(e) => setForm({ ...form, startedAt: e.target.value })} /></label>
    <label className="form-field">Prazo<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
    <label className="form-field form-field--wide">Notas<textarea rows={4} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
    <div className="form-actions">{project && <Button type="button" variant="danger" onClick={() => setConfirmingDelete(true)}>Excluir</Button>}<Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar projeto</Button></div>
    {confirmingDelete && project && <ConfirmDialog title="Remover projeto?" description={`O projeto ${project.projectType} será removido do controle de entregas.`} onCancel={() => setConfirmingDelete(false)} onConfirm={async () => { await deleteProject(project.id); onClose() }} />}
  </form></Modal>
}

export function AgendaPage() {
  const { activities, leads, toggleActivity } = useAppStore()
  const [view, setView] = useState<'Semana'|'Dia'>('Semana')
  const [status, setStatus] = useState<'Todas'|Activity['status']>('Todas')
  const [type, setType] = useState<'Todos'|Activity['type']>('Todos')
  const [editing, setEditing] = useState<Activity | null>(null)
  const [creating, setCreating] = useState(false)
  const visible = activities.filter((item) => (status === 'Todas' || item.status === status) && (type === 'Todos' || item.type === type)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const base = visible[0]?.date ?? today()
  const days = Array.from({ length: 7 }, (_, index) => { const date = addDays(base, index); return { label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(`${date}T00:00:00`)).slice(0, 3), date, day: date.slice(-2) } })
  return <div className="page"><PageTitle eyebrow="Planejamento" title="Agenda" description="Reuniões, entregas e follow-ups em uma única visão." action="Nova ação" onAction={() => setCreating(true)} /><section className="agenda-layout"><article className="panel agenda-calendar"><header className="calendar-header"><div><button className="icon-button" aria-label="Semana anterior"><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Próxima semana"><ChevronRight size={17} /></button><strong>{shortDate(days[0].date)} - {shortDate(days[6].date)}</strong></div><div className="segmented"><button className={view === 'Dia' ? 'active' : ''} onClick={() => setView('Dia')}>Dia</button><button className={view === 'Semana' ? 'active' : ''} onClick={() => setView('Semana')}>Semana</button></div></header><div className={view === 'Dia' ? 'week-grid week-grid--day' : 'week-grid'}>{days.map((day,index) => <div key={day.date} className={index === 0 ? 'week-day week-day--today' : 'week-day'}><header><span>{day.label}</span><strong>{day.day}</strong></header>{visible.filter((activity) => activity.date === day.date).map((activity) => <button className={`calendar-event calendar-event--${activity.type.toLowerCase().replaceAll(' ','-')}`} key={activity.id} onClick={() => setEditing(activity)}><time>{activity.time}</time><strong>{activity.title}</strong><small>{leadName(leads, activity.leadId)}</small>{activity.status === 'Concluída' && <Check size={13} />}</button>)}</div>)}</div></article><aside className="panel agenda-list"><header className="panel__header"><div><span className="eyebrow">Execução</span><h2>Próximas ações</h2></div><ListFilter size={17} /></header><div className="agenda-tabs">{(['Todas','Pendente','Atrasada','Concluída'] as const).map((item) => <button className={status === item ? 'active' : ''} onClick={() => setStatus(item)} key={item}>{item}</button>)}</div><label className="form-field">Tipo<select value={type} onChange={(e) => setType(e.target.value as typeof type)}><option>Todos</option>{activityTypes.map((item) => <option key={item}>{item}</option>)}</select></label><div className="agenda-items">{visible.map((activity) => <label key={activity.id} onDoubleClick={() => setEditing(activity)}><input type="checkbox" checked={activity.status === 'Concluída'} onChange={() => toggleActivity(activity.id)} /><span className="check-control"><Check size={12} /></span><span><strong>{activity.title}</strong><small>{leadName(leads, activity.leadId)} · {shortDate(activity.date)}, {activity.time}</small></span><Badge tone={tone(activity.status)}>{activity.status}</Badge></label>)}</div></aside></section>{creating && <ActivityForm leads={leads} onClose={() => setCreating(false)} />}{editing && <ActivityForm activity={editing} leads={leads} onClose={() => setEditing(null)} />}</div>
}

export function ProposalsPage() {
  const { proposals, leads } = useAppStore()
  const [filter, setFilter] = useState<'Todos'|Proposal['status']>('Todos')
  const [editing, setEditing] = useState<Proposal | null>(null)
  const [creating, setCreating] = useState(false)
  const visible = proposals.filter((proposal) => filter === 'Todos' || proposal.status === filter)
  const pipeline = proposals.filter((proposal) => ['Enviada','Em negociação'].includes(proposal.status)).reduce((sum, proposal) => sum + proposal.value, 0)
  const open = proposals.filter((proposal) => !['Aceita','Recusada','Expirada'].includes(proposal.status))
  const averageChance = open.length ? Math.round(open.reduce((sum, proposal) => sum + proposal.probability, 0) / open.length) : 0
  return <div className="page"><PageTitle eyebrow="Documentos comerciais" title="Propostas" description="Acompanhe validade, valor e chance de fechamento." action="Nova proposta" onAction={() => setCreating(true)} /><section className="summary-strip"><div><FileText size={17}/><span>Em aberto<strong>{open.length}</strong></span></div><div><Target size={17}/><span>Valor no pipeline<strong>{currency.format(pipeline)}</strong></span></div><div><TrendingUp size={17}/><span>Chance média<strong>{averageChance}%</strong></span></div><div><CheckCircle2 size={17}/><span>Aceitas<strong>{proposals.filter((proposal) => proposal.status === 'Aceita').length}</strong></span></div></section><section className="panel table-panel"><div className="table-toolbar"><div><strong className="toolbar-title">Propostas recentes</strong><span className="toolbar-subtitle">Clique em uma linha para editar</span></div><div className="table-filters"><label><select aria-label="Filtrar propostas" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option>Todos</option>{proposalStatuses.map((item) => <option key={item}>{item}</option>)}</select><ChevronRight size={13}/></label></div></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>Lead</th><th>Projeto / plano</th><th>Valor</th><th>Status</th><th>Probabilidade</th><th>Validade</th><th /></tr></thead><tbody>{visible.map((proposal) => { const lead = leads.find((item) => item.id === proposal.leadId); return <tr key={proposal.id} onClick={() => setEditing(proposal)}><td><div className="lead-cell"><span className="business-avatar">{lead?.businessName.slice(0,2).toUpperCase() ?? 'OR'}</span><span><strong>{lead?.businessName ?? 'Lead removido'}</strong><small>{lead?.contactName ?? 'Cliente Origami'}</small></span></div></td><td><strong className="table-primary">{proposal.projectType}</strong><small className="table-secondary">{proposal.planName}</small></td><td className="numeric">{currency.format(proposal.value)}</td><td><Badge tone={tone(proposal.status)}>{proposal.status}</Badge></td><td><div className="probability"><span><i style={{width:`${proposal.probability}%`}} /></span><strong>{proposal.probability}%</strong></div></td><td>{shortDate(proposal.validUntil)}</td><td><button className="icon-button" aria-label="Editar proposta" onClick={(event) => { event.stopPropagation(); setEditing(proposal) }}><MoreHorizontal size={17}/></button></td></tr>})}</tbody></table>{visible.length === 0 && <div className="table-empty">Nenhuma proposta encontrada.</div>}</div></section>{creating && <ProposalForm leads={leads} onClose={() => setCreating(false)} />}{editing && <ProposalForm proposal={editing} leads={leads} onClose={() => setEditing(null)} />}</div>
}

export function ProjectsPage() {
  const { projects, leads } = useAppStore()
  const [editing, setEditing] = useState<Project | null>(null)
  const [creating, setCreating] = useState(false)
  const dueSoon = projects.filter((project) => project.deadline <= addDays(today(), 7) && !['Entregue','Cancelado'].includes(project.status)).length
  return <div className="page"><PageTitle eyebrow="Clientes fechados" title="Projetos" description="Da assinatura à entrega, acompanhe o progresso de cada projeto." action="Novo projeto" onAction={() => setCreating(true)} /><section className="project-overview"><div><span className="overview-icon"><Clock3 size={18}/></span><span>Em andamento<strong>{projects.filter((project) => !['Entregue','Cancelado'].includes(project.status)).length}</strong></span></div><div><span className="overview-icon overview-icon--purple"><Target size={18}/></span><span>Para entregar em 7 dias<strong>{dueSoon}</strong></span></div><div><span className="overview-icon overview-icon--green"><CheckCircle2 size={18}/></span><span>Entregues<strong>{projects.filter((project) => project.status === 'Entregue').length}</strong></span></div></section><section className="project-grid">{projects.map((project) => { const lead = leads.find((item) => item.id === project.leadId); const progress = projectProgress(project); return <article className="project-card" key={project.id}><header><span className="business-avatar">{(lead?.businessName ?? 'OR').slice(0,2).toUpperCase()}</span><div><h2>{lead?.businessName ?? 'Lead removido'}</h2><p>{project.projectType}</p></div><button className="icon-button" aria-label="Editar projeto" onClick={() => setEditing(project)}><MoreHorizontal size={17}/></button></header><div className="project-card__meta"><Badge tone={tone(project.status)}>{project.status}</Badge><Badge tone="neutral">{project.currentStage}</Badge></div><div className="project-progress"><div><span>Progresso</span><strong>{progress}%</strong></div><div><i style={{width:`${progress}%`}}/></div></div><dl><div><dt>Valor</dt><dd>{currency.format(project.value)}</dd></div><div><dt>Prazo</dt><dd>{shortDate(project.deadline)}</dd></div><div><dt>Pagamento</dt><dd><Badge tone={tone(project.paymentStatus)}>{project.paymentStatus}</Badge></dd></div></dl></article>})}</section>{creating && <ProjectForm leads={leads} onClose={() => setCreating(false)} />}{editing && <ProjectForm project={editing} leads={leads} onClose={() => setEditing(null)} />}</div>
}

export function FinancePage() {
  const { projects, proposals, leads } = useAppStore()
  const closedRevenue = projects.reduce((sum, project) => sum + project.value, 0)
  const pending = projects.filter((project) => project.paymentStatus !== 'Pago').reduce((sum, project) => sum + project.value, 0)
  const expected = proposals.filter((proposal) => !['Aceita','Recusada','Expirada'].includes(proposal.status)).reduce((sum, proposal) => sum + proposal.value, 0)
  const paidClients = projects.filter((project) => project.paymentStatus === 'Pago').length
  const averageTicket = projects.length ? closedRevenue / projects.length : 0
  const biggest = projects.reduce((max, project) => Math.max(max, project.value), 0)
  const revenueMix = useMemo(() => revenueByProject(projects), [projects])
  const monthly = useMemo(() => {
    const values = new Map<string, number>()
    projects.forEach((project) => values.set(monthLabel(project.startedAt || today()), (values.get(monthLabel(project.startedAt || today())) ?? 0) + project.value))
    return Array.from(values, ([month, value]) => ({ month, value })).slice(-6)
  }, [projects])
  return <div className="page"><PageTitle eyebrow="Visão financeira" title="Financeiro" description="Receitas, previsões e pagamentos sem complexidade bancária." /><section className="finance-metrics"><article className="finance-hero"><span>Receita fechada total</span><strong>{currency.format(closedRevenue)}</strong><small><TrendingUp size={14}/> {projects.length} projetos fechados</small></article><article><span>Receita prevista</span><strong>{currency.format(expected)}</strong><small>{proposals.length} propostas</small></article><article><span>Valores pendentes</span><strong>{currency.format(pending)}</strong><small>{projects.filter((project) => project.paymentStatus !== 'Pago').length} pagamentos</small></article><article><span>Ticket médio</span><strong>{currency.format(averageTicket)}</strong><small>Maior projeto: {currency.format(biggest)}</small></article></section><section className="finance-layout"><article className="panel"><header className="panel__header"><div><span className="eyebrow">Evolução</span><h2>Receita por mês</h2></div><Badge tone="success">{paidClients} pagos</Badge></header><div className="finance-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F4"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value)/1000}k`}/><Tooltip contentStyle={chartTooltip} formatter={(value) => currency.format(Number(value))}/><Bar dataKey="value" fill="#5B7CFF" radius={[5,5,2,2]}/></BarChart></ResponsiveContainer></div></article><article className="panel"><header className="panel__header"><div><span className="eyebrow">Distribuição</span><h2>Receita por oferta</h2></div></header><div className="revenue-mix">{revenueMix.map((item) => <div key={item.name}><span><i style={{background:item.color}}/>{item.name}</span><strong>{currency.format(item.amount)}</strong><small>{item.value}%</small></div>)}</div>{revenueMix.length === 0 && <div className="table-empty">Nenhum projeto fechado ainda.</div>}</article></section><section className="panel payment-list"><header className="panel__header"><div><span className="eyebrow">Controle</span><h2>Pagamentos dos projetos</h2></div></header>{projects.map((project) => { const lead = leads.find((item) => item.id === project.leadId); return <div key={project.id}><span className="business-avatar">{(lead?.businessName ?? 'OR').slice(0,2).toUpperCase()}</span><span><strong>{lead?.businessName ?? 'Lead removido'}</strong><small>{project.projectType}</small></span><strong>{currency.format(project.value)}</strong><Badge tone={tone(project.paymentStatus)}>{project.paymentStatus}</Badge><time>{shortDate(project.deadline)}</time></div>})}</section></div>
}

export function ReportsPage() {
  const { activities, leads } = useAppStore()
  const sources = useMemo(() => sourceDistribution(leads), [leads])
  const conversions = useMemo(() => projectConversion(leads), [leads])
  const losses = useMemo(() => lossDistribution(leads), [leads])
  const insight = useMemo(() => reportInsight(leads), [leads])
  const health = useMemo(() => funnelHealth(leads, activities), [leads, activities])
  return <div className="page"><PageTitle eyebrow="Inteligência comercial" title="Relatórios" description="Entenda o que gera oportunidades e onde o funil perde força." /><section className="report-alert"><Target size={19}/><div><strong>{insight.title}</strong><p>{insight.description}</p></div><Button variant="secondary">Ver plano de ação</Button></section><section className="reports-grid"><article className="panel"><header className="panel__header"><div><span className="eyebrow">Aquisição</span><h2>Leads por origem</h2></div></header><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={sources} layout="vertical"><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={82} axisLine={false} tickLine={false} tick={{fontSize:10}}/><Tooltip contentStyle={chartTooltip} formatter={(value, name) => [name === 'count' ? `${value} leads` : `${value}%`, name === 'count' ? 'Volume' : 'Participação']}/><Bar dataKey="count" fill="#5B7CFF" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div></article><article className="panel"><header className="panel__header"><div><span className="eyebrow">Conversão</span><h2>Taxa por oferta</h2></div></header><div className="conversion-list">{conversions.map((item) => <div key={item.name}><span>{item.name}</span><div><i style={{width:`${item.value}%`,background:item.color}}/></div><strong>{item.value}%</strong></div>)}</div>{conversions.length === 0 && <div className="table-empty">Cadastre leads para calcular conversão.</div>}</article><article className="panel"><header className="panel__header"><div><span className="eyebrow">Perdas</span><h2>Motivos de perda</h2></div></header><div className="loss-list">{losses.map((item,index) => <div key={item.name}><span><i style={{opacity:1-index*.18}}/>{item.name}</span><strong>{item.value}%</strong></div>)}</div>{losses.length === 0 && <div className="table-empty">Nenhum lead perdido registrado ainda.</div>}</article><article className="panel"><header className="panel__header"><div><span className="eyebrow">Saúde do funil</span><h2>Atenções necessárias</h2></div></header><div className="health-list"><div><span className="overview-icon overview-icon--amber"><Clock3 size={17}/></span><span><strong>{health.withoutAction} sem próxima ação</strong><small>{health.overdue} ações atrasadas no momento</small></span><Badge tone="warning">Revisar</Badge></div><div><span className="overview-icon overview-icon--purple"><CalendarDays size={17}/></span><span><strong>{health.future} para retomar</strong><small>{health.stalled} leads parados há mais de 7 dias</small></span><Badge tone="purple">Agendar</Badge></div><div><span className="overview-icon overview-icon--green"><Users size={17}/></span><span><strong>{health.hot} leads quentes</strong><small>Priorize follow-ups de alta intenção</small></span><Badge tone="success">Ver lista</Badge></div></div></article></section></div>
}

export function SettingsPage() {
  const [active, setActive] = useState('Tipos de projeto')
  const [options, setOptions] = useState<settingsService.SettingOption[]>([])
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<settingsService.SettingOption | null>(null)
  const [loading, setLoading] = useState(false)
  const localKey = 'origami-settings-options-v1'
  const defaults = useMemo<settingsService.SettingOption[]>(() => settingCategories.flatMap((category) => (settingDefaults[category] ?? []).map((label, index) => ({ id: `default-${category}-${label}`, category, label, value: label, color: settingColors[index % settingColors.length], orderIndex: index, isActive: true }))), [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const saved = JSON.parse(localStorage.getItem(localKey) ?? 'null') as settingsService.SettingOption[] | null
        setOptions(saved?.length ? saved : defaults)
      } catch {
        setOptions(defaults)
      }
      return
    }
    let mounted = true
    setLoading(true)
    settingsService.listSettings().then((items) => {
      if (!mounted) return
      const merged = [...items]
      defaults.forEach((fallback) => {
        if (!merged.some((item) => item.category === fallback.category && item.value === fallback.value)) merged.push(fallback)
      })
      setOptions(merged)
    }).catch(() => {
      if (mounted) {
        setOptions(defaults)
        setError('Não foi possível carregar opções do Supabase. Mostrando opções locais.')
      }
    }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [defaults])

  useEffect(() => {
    if (!isSupabaseConfigured && options.length) localStorage.setItem(localKey, JSON.stringify(options))
  }, [options])

  const visible = options.filter((option) => option.category === active)
  const addOption = async (event?: FormEvent) => {
    event?.preventDefault()
    const label = draft.trim()
    if (!label) return
    setError('')
    setNotice('')
    if (visible.some((option) => option.value.toLowerCase() === label.toLowerCase())) {
      setError('Essa opção já existe nesta categoria.')
      return
    }
    const next = { category: active, label, value: label, color: '#5B7CFF', orderIndex: visible.length, isActive: true }
    try {
      const saved = isSupabaseConfigured ? await settingsService.createSetting(next) : { id: crypto.randomUUID(), ...next }
      setOptions((items) => [...items, saved])
      setDraft('')
      setNotice(`${label} adicionado em ${active}.`)
    } catch {
      setError('Não foi possível salvar a opção. Verifique login e permissões no Supabase.')
    }
  }
  const removeOption = async () => {
    if (!removing) return
    try {
      if (isSupabaseConfigured && !removing.id.startsWith('default-')) await settingsService.deleteSetting(removing.id)
      setOptions((items) => items.filter((item) => item.id !== removing.id))
      setNotice(`${removing.label} removido de ${removing.category}.`)
      setRemoving(null)
    } catch {
      setError('Não foi possível remover a opção no Supabase.')
      setRemoving(null)
    }
  }
  return <div className="page"><PageTitle eyebrow="Personalização" title="Configurações" description="Adapte o Command Center à operação da Origami Labs." /><section className="settings-layout"><aside className="panel settings-nav"><span>Configurações do workspace</span>{settingCategories.map((category) => <button className={active === category ? 'active' : ''} onClick={() => { setActive(category); setDraft(''); setError(''); setNotice('') }} key={category}>{category}<ChevronRight size={14}/></button>)}</aside><article className="panel settings-content"><header><div><span className="eyebrow">Opções comerciais</span><h2>{active}</h2><p>{loading ? 'Carregando opções...' : 'Edite as opções disponíveis nos formulários e filtros.'}</p></div><Button disabled={!draft.trim()} onClick={() => void addOption()}><Plus size={16}/>Adicionar opção</Button></header><form className="settings-add" onSubmit={(event) => void addOption(event)}>Nova opção<input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Adicionar em ${active.toLowerCase()}`} />{error && <span className="settings-message settings-message--error">{error}</span>}{notice && <span className="settings-message">{notice}</span>}</form><div className="settings-options">{visible.map((option,index) => <div key={option.id}><span className="drag-handle">::</span><span className="option-color" style={{background:option.color ?? settingColors[index%settingColors.length]}}/><strong>{option.label}</strong><Badge tone={option.isActive ? 'success' : 'neutral'}>{option.isActive ? 'Ativo' : 'Inativo'}</Badge><button className="icon-button" onClick={() => setRemoving(option)} aria-label={`Remover ${option.label}`}><MoreHorizontal size={17}/></button></div>)}</div><footer><span>{isSupabaseConfigured ? 'As alterações são persistidas no Supabase quando você adiciona ou remove uma opção.' : 'Sem Supabase configurado, as alterações ficam salvas neste navegador.'}</span><Button disabled={!draft.trim()} onClick={() => void addOption()}>Salvar alteração</Button></footer></article></section>{removing && <ConfirmDialog title={`Remover ${removing.label}?`} description={`Essa opção deixará de aparecer em ${removing.category}. Você pode cadastrá-la novamente depois.`} onCancel={() => setRemoving(null)} onConfirm={removeOption} />}</div>
}
