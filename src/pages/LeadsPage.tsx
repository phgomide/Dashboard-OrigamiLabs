import { Archive, AtSign, CheckCircle2, ChevronDown, Globe2, MapPin, MessageCircle, MoreHorizontal, Phone, Plus, RotateCcw, Search, SlidersHorizontal, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Modal } from '../components/ui'
import { LeadForm } from '../components/LeadForm'
import { currency, shortDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { Lead } from '../types'

const tempTone = (value: Lead['temperature']) => value === 'Quente' ? 'danger' : value === 'Morno' ? 'warning' : 'neutral'
const statusTone = (value: Lead['pipelineStatus']) => value === 'Fechado' ? 'success' : value === 'Perdido' ? 'danger' : value === 'Futuro' ? 'purple' : 'primary'
const digits = (value: string) => value.replace(/\D/g, '')
const externalUrl = (value?: string) => value && /^https?:\/\//i.test(value) ? value : value ? `https://${value}` : ''
const instagramUrl = (value?: string) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `https://instagram.com/${value.replace('@', '').replace(/^instagram\.com\//, '')}`
}
const whatsappUrl = (value?: string) => {
  if (!value) return ''
  const clean = digits(value)
  return clean ? `https://wa.me/${clean.startsWith('55') ? clean : `55${clean}`}` : ''
}

export function LeadsPage() {
  const { leads, updateLead, deleteLead } = useAppStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [project, setProject] = useState('Todos')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => leads.filter((lead) => {
    const matchesQuery = `${lead.businessName} ${lead.contactName ?? ''} ${lead.ownerName ?? ''} ${lead.niche} ${lead.city}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (status === 'Todos' || lead.pipelineStatus === status) && (project === 'Todos' || lead.projectInterest === project)
  }), [leads, query, status, project])
  const statuses = ['Todos', ...new Set(leads.map((lead) => lead.pipelineStatus))]
  const projects = ['Todos', ...new Set(leads.map((lead) => lead.projectInterest))]

  const setLeadStatus = (lead: Lead, pipelineStatus: Lead['pipelineStatus']) => {
    updateLead(lead.id, { pipelineStatus, ...(pipelineStatus === 'Fechado' ? { finalValue: lead.estimatedValue } : {}) })
    setSelected((current) => current?.id === lead.id ? { ...current, pipelineStatus } : current)
  }

  return <div className="page">
    <section className="page-heading">
      <div><span className="eyebrow">CRM comercial</span><h1>Leads</h1><p><strong>{leads.length} contatos</strong> em diferentes momentos da jornada comercial.</p></div>
      <Button onClick={() => setCreating(true)}><Plus size={17} />Criar lead</Button>
    </section>

    <section className="lead-stats">
      <div><span>Ativos</span><strong>{leads.filter((lead) => !['Fechado', 'Perdido', 'Futuro'].includes(lead.pipelineStatus)).length}</strong></div>
      <div><span>Quentes</span><strong>{leads.filter((lead) => lead.temperature === 'Quente').length}</strong></div>
      <div><span>Fechados</span><strong>{leads.filter((lead) => lead.pipelineStatus === 'Fechado').length}</strong></div>
      <div><span>Em propostas</span><strong>{leads.filter((lead) => ['Proposta enviada', 'Negociação'].includes(lead.pipelineStatus)).length}</strong></div>
    </section>

    <section className="panel table-panel">
      <div className="table-toolbar">
        <label className="table-search"><Search size={16} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por negócio, contato ou nicho" /></label>
        <div className="table-filters">
          <label><SlidersHorizontal size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status">{statuses.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
          <label><select value={project} onChange={(event) => setProject(event.target.value)} aria-label="Filtrar por projeto">{projects.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
        </div>
      </div>
      <div className="data-table-wrap">
        <table className="data-table"><thead><tr><th>Lead</th><th>Status</th><th>Projeto</th><th>Temperatura</th><th>Valor</th><th>Próxima ação</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id} onClick={() => setSelected(lead)}><td><div className="lead-cell"><span className="business-avatar">{lead.businessName.slice(0, 2).toUpperCase()}</span><span><strong>{lead.businessName}</strong><small>{lead.contactName ?? lead.ownerName ?? lead.niche} · {lead.city}</small></span></div></td><td><Badge tone={statusTone(lead.pipelineStatus)}>{lead.pipelineStatus}</Badge></td><td><strong className="table-primary">{lead.projectInterest}</strong><small className="table-secondary">{lead.source}</small></td><td><Badge tone={tempTone(lead.temperature)}>{lead.temperature}</Badge></td><td className="numeric">{currency.format(lead.finalValue ?? lead.estimatedValue)}</td><td><strong className="table-primary">{lead.nextAction}</strong><small className="table-secondary">{shortDate(lead.nextActionDate)}</small></td><td><button className="icon-button" aria-label={`Ações para ${lead.businessName}`} onClick={(event) => { event.stopPropagation(); setSelected(lead) }}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>
        {filtered.length === 0 && <div className="table-empty">Nenhum lead corresponde aos filtros.</div>}
      </div>
      <footer className="table-footer"><span>Exibindo {filtered.length} de {leads.length} leads</span><div><button disabled>Anterior</button><button disabled>Próxima</button></div></footer>
    </section>

    {creating && <LeadForm onClose={() => setCreating(false)} />}
    {selected && <Modal title={selected.businessName} onClose={() => setSelected(null)} size="lg">
      <div className="lead-detail">
        <div className="lead-detail__summary">
          <span className="business-avatar business-avatar--large">{selected.businessName.slice(0, 2).toUpperCase()}</span>
          <div><h3>{selected.businessName}</h3><p>{selected.contactName ?? selected.ownerName ?? 'Contato não informado'} · {selected.niche}</p><div><Badge tone={statusTone(selected.pipelineStatus)}>{selected.pipelineStatus}</Badge><Badge tone={tempTone(selected.temperature)}>{selected.temperature}</Badge>{selected.importScore && <Badge tone="neutral">Score {selected.importScore}/5</Badge>}</div></div>
          <strong>{currency.format(selected.finalValue ?? selected.estimatedValue)}</strong>
        </div>
        <div className="detail-grid">
          <div><span>Interesse</span><strong>{selected.projectInterest}</strong></div>
          <div><span>Origem</span><strong>{selected.source}</strong></div>
          <div><span>Cidade</span><strong>{selected.city}</strong></div>
          <div><span>Pagamento</span><strong>{selected.paymentStatus}</strong></div>
          <div><span>Próxima ação</span><strong>{selected.nextAction ?? 'Não definida'}</strong></div>
          <div><span>Data</span><strong>{shortDate(selected.nextActionDate)}</strong></div>
        </div>
        <div className="lead-contact-panel"><span>Contato e links</span><div>{selected.phone && <a href={`tel:${digits(selected.phone)}`}><Phone size={15} />{selected.phone}</a>}{selected.whatsapp && <a href={whatsappUrl(selected.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp</a>}{selected.instagram && <a href={instagramUrl(selected.instagram)} target="_blank" rel="noreferrer"><AtSign size={15} />Instagram</a>}{selected.googleMapsUrl && <a href={selected.googleMapsUrl} target="_blank" rel="noreferrer"><MapPin size={15} />Google Maps</a>}{selected.website && <a href={externalUrl(selected.website)} target="_blank" rel="noreferrer"><Globe2 size={15} />Site</a>}{!selected.phone && !selected.whatsapp && !selected.instagram && !selected.googleMapsUrl && !selected.website && <small>Nenhum canal informado ainda.</small>}</div></div>
        <div className="detail-note"><span>Observações</span><p>{selected.commercialNote ?? selected.notes ?? 'Sem observações.'}</p></div>
        <div className="detail-actions"><Button variant="secondary" onClick={() => setLeadStatus(selected, 'Futuro')}><RotateCcw size={16} />Retomar depois</Button><Button variant="secondary" onClick={() => setLeadStatus(selected, 'Perdido')}><XCircle size={16} />Marcar perdido</Button><Button onClick={() => setLeadStatus(selected, 'Fechado')}><CheckCircle2 size={16} />Marcar fechado</Button><Button variant="ghost" aria-label="Excluir lead" onClick={async () => { if (window.confirm(`Excluir ${selected.businessName}? Os dados relacionados também serão removidos.`)) { await deleteLead(selected.id); setSelected(null) } }}><Archive size={16} /></Button></div>
      </div>
    </Modal>}
  </div>
}
