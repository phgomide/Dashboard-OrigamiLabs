import { AlertCircle, Archive, AtSign, CalendarClock, CheckCircle2, ChevronDown, ClipboardList, ExternalLink, Globe2, MapPin, MessageCircle, MoreHorizontal, Phone, Plus, RotateCcw, Search, SlidersHorizontal, Trash2, XCircle } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Badge, Button, Modal } from '../components/ui'
import { LeadForm } from '../components/LeadForm'
import { currency, shortDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { countCleanupEligibleDuplicateExtras, countDuplicateExtras, findDuplicateLeadGroups } from '../services/leads'
import { buildWhatsAppUrl, safeExternalUrl, safeInstagramUrl } from '../lib/leadLinks'
import type { Lead } from '../types'

const tempTone = (value: Lead['temperature']) => value === 'Quente' ? 'danger' : value === 'Morno' ? 'warning' : 'neutral'
const statusTone = (value: Lead['pipelineStatus']) => value === 'Fechado' ? 'success' : value === 'Perdido' ? 'danger' : value === 'Futuro' ? 'purple' : 'primary'
const digits = (value: string) => value.replace(/\D/g, '')
const externalUrl = (value?: string) => safeExternalUrl(value)
const instagramUrl = (value?: string) => safeInstagramUrl(value)
const whatsappUrl = (value?: string, messageUrl?: string, message?: string) => buildWhatsAppUrl(value, messageUrl, message)
const display = (value?: string | number | null) => value === undefined || value === null || value === '' ? 'Não informado' : String(value)
const firstDateAfter = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10) }
const dateTime = (value?: string) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Sem data'
const splitCityState = (city?: string) => {
  const [cityName, stateName] = (city ?? '').split(',').map((part) => part.trim())
  return { cityName: cityName || 'Não informado', stateName: stateName || 'Não informado' }
}
const Field = ({ label, value }: { label: string; value?: string | number | null }) => <div><span>{label}</span><strong>{display(value)}</strong></div>
const LinkItem = ({ href, icon, children }: { href?: string; icon: ReactNode; children: ReactNode }) => href ? <a href={href} target="_blank" rel="noreferrer">{icon}{children}<ExternalLink size={13} /></a> : null

export function LeadsPage() {
  const { leads, updateLead, deleteLead, cleanupDuplicateLeads } = useAppStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [project, setProject] = useState('Todos')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [creating, setCreating] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  const filtered = useMemo(() => leads.filter((lead) => {
    const matchesQuery = `${lead.businessName} ${lead.contactName ?? ''} ${lead.ownerName ?? ''} ${lead.niche} ${lead.city}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (status === 'Todos' || lead.pipelineStatus === status) && (project === 'Todos' || lead.projectInterest === project)
  }), [leads, query, status, project])
  const statuses = ['Todos', ...new Set(leads.map((lead) => lead.pipelineStatus))]
  const projects = ['Todos', ...new Set(leads.map((lead) => lead.projectInterest))]

  const setLeadStatus = async (lead: Lead, pipelineStatus: Lead['pipelineStatus']) => {
    const patch: Partial<Lead> = { pipelineStatus }
    if (pipelineStatus === 'Fechado') {
      patch.finalValue = lead.estimatedValue
      patch.closedAt = new Date().toISOString()
      patch.conversionStatus = 'convertido'
    }
    try {
      await updateLead(lead.id, patch)
      setSelected((current) => current?.id === lead.id ? { ...current, ...patch } : current)
      setActionMessage('Lead atualizado.')
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Não foi possível atualizar o lead.')
    }
  }

  const openWhatsAppFirstContact = async (lead: Lead) => {
    const url = whatsappUrl(lead.whatsapp ?? lead.phone, lead.whatsappUrl, lead.personalizedMessage)
    if (!url) {
      setActionMessage('Este lead não possui um telefone/WhatsApp utilizável.')
      return
    }
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) {
      setActionMessage('O navegador bloqueou a janela do WhatsApp. Permita pop-ups e tente novamente.')
      return
    }
    if (!window.confirm('Confirme somente depois de enviar a mensagem no WhatsApp. Deseja registrar este lead como primeiro contato?')) return
    const firstTouchAt = lead.firstTouchAt ?? new Date().toISOString()
    const patch: Partial<Lead> = {
      pipelineStatus: lead.pipelineStatus === 'Novo lead' ? 'Primeiro contato' : lead.pipelineStatus,
      outreachStatus: 'abordado_manual',
      responseStatus: lead.responseStatus === 'nao_abordado' ? 'sem_resposta' : lead.responseStatus,
      firstTouchAt,
      nextAction: 'Aguardar resposta do primeiro contato manual pelo WhatsApp',
      nextActionDate: lead.nextActionDate ?? firstDateAfter(7),
      nextFollowupDate: lead.nextFollowupDate ?? firstDateAfter(7),
    }
    try {
      await updateLead(lead.id, patch)
      setSelected((current) => current?.id === lead.id ? { ...current, ...patch } : current)
      setActionMessage('Contato manual confirmado e salvo.')
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'WhatsApp abriu, mas não foi possível salvar o contato.')
    }
  }

  const duplicateGroups = useMemo(() => findDuplicateLeadGroups(leads), [leads])
  const duplicateCount = useMemo(() => countDuplicateExtras(duplicateGroups), [duplicateGroups])
  const cleanupEligibleDuplicateCount = useMemo(() => countCleanupEligibleDuplicateExtras(duplicateGroups), [duplicateGroups])
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false)
  const [duplicateMessage, setDuplicateMessage] = useState('')

  const cleanDuplicates = async () => {
    setCleaningDuplicates(true)
    setDuplicateMessage('')
    try {
      const deleted = await cleanupDuplicateLeads()
      setDuplicateMessage(deleted > 0 ? `${deleted} lead(s) repetido(s) seguro(s) da automação removido(s).` : 'Nenhum duplicado seguro da automação pendente. Duplicados por telefone/Maps/nome devem ser revisados manualmente.')
    } catch (error) {
      setDuplicateMessage(error instanceof Error ? error.message : 'Nao foi possivel limpar leads duplicados.')
    } finally {
      setCleaningDuplicates(false)
    }
  }

  const selectedCity = selected ? splitCityState(selected.city) : { cityName: '', stateName: '' }
  const selectedWhatsApp = selected ? whatsappUrl(selected.whatsapp ?? selected.phone, selected.whatsappUrl, selected.personalizedMessage) : ''

  return <div className="page">
    <section className="page-heading">
      <div><span className="eyebrow">CRM comercial</span><h1>Leads</h1><p><strong>{leads.length} contatos</strong> em diferentes momentos da jornada comercial.</p></div>
      <Button onClick={() => setCreating(true)}><Plus size={17} />Criar lead</Button>
    </section>

    {(duplicateCount > 0 || duplicateMessage) && <section className="duplicate-alert">
      <div><AlertCircle size={17} /><span><strong>{duplicateCount > 0 ? `${duplicateCount} lead(s) repetido(s) detectado(s)` : 'Verificacao de duplicados concluida'}</strong><small>{duplicateCount > 0 ? `Criterios: ${duplicateGroups.slice(0, 3).map((group) => group.label).join(', ')}. A limpeza automática remove apenas duplicados seguros da automação; demais casos ficam como alerta para revisão.` : duplicateMessage}</small></span></div>
      {cleanupEligibleDuplicateCount > 0 && <Button variant="secondary" onClick={() => void cleanDuplicates()} disabled={cleaningDuplicates}><Trash2 size={15} />{cleaningDuplicates ? 'Limpando...' : 'Limpar duplicados seguros'}</Button>}
    </section>}

    {actionMessage && <p className="settings-message">{actionMessage}</p>}

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

        <section className="lead-detail-section">
          <h4><ClipboardList size={15} />Dados do lead</h4>
          <div className="detail-grid detail-grid--wide">
            <Field label="Nome do negócio" value={selected.businessName} />
            <Field label="Contato / dono" value={selected.contactName ?? selected.ownerName} />
            <Field label="Nicho" value={selected.niche} />
            <Field label="Cidade" value={selectedCity.cityName} />
            <Field label="Estado" value={selectedCity.stateName} />
            <Field label="Origem" value={selected.source} />
            <Field label="Interesse" value={selected.projectInterest} />
            <Field label="Criado em" value={dateTime(selected.createdAt)} />
            <Field label="Atualizado em" value={dateTime(selected.updatedAt)} />
            <Field label="Próxima ação" value={selected.nextAction} />
            <Field label="Data da próxima ação" value={shortDate(selected.nextActionDate)} />
            <Field label="Origem importação" value={selected.importOrigin} />
          </div>
        </section>

        <section className="lead-detail-section">
          <h4><Phone size={15} />Contato e links</h4>
          <div className="lead-contact-panel"><div>
            {selected.phone && <a href={`tel:${digits(selected.phone)}`}><Phone size={15} />{selected.phone}</a>}
            {selectedWhatsApp && <button type="button" className="lead-whatsapp-button" onClick={() => openWhatsAppFirstContact(selected)}><MessageCircle size={15} />Abrir WhatsApp e mover para primeiro contato<ExternalLink size={13} /></button>}
            <LinkItem href={selected.instagram ? instagramUrl(selected.instagram) : ''} icon={<AtSign size={15} />}>Instagram</LinkItem>
            <LinkItem href={selected.googleMapsUrl} icon={<MapPin size={15} />}>Google Maps</LinkItem>
            <LinkItem href={selected.website ? externalUrl(selected.website) : ''} icon={<Globe2 size={15} />}>Site</LinkItem>
            <LinkItem href={selected.publicLink ? externalUrl(selected.publicLink) : ''} icon={<ExternalLink size={15} />}>Link público</LinkItem>
            {!selected.phone && !selectedWhatsApp && !selected.instagram && !selected.googleMapsUrl && !selected.website && !selected.publicLink && <small>Nenhum canal informado ainda.</small>}
          </div></div>
          <div className="detail-grid detail-grid--wide">
            <Field label="Telefone" value={selected.phone} />
            <Field label="WhatsApp" value={selected.whatsapp ?? selected.phone} />
            <Field label="Instagram" value={selected.instagram} />
            <Field label="Google Maps" value={selected.googleMapsUrl} />
            <Field label="Site" value={selected.website} />
            <Field label="URL WhatsApp" value={selected.whatsappUrl} />
          </div>
        </section>

        <section className="lead-detail-section">
          <h4><CalendarClock size={15} />Pipeline e automação</h4>
          <div className="detail-grid detail-grid--wide">
            <Field label="Status" value={selected.pipelineStatus} />
            <Field label="Temperatura" value={selected.temperature} />
            <Field label="Prioridade" value={selected.priority} />
            <Field label="Score importação" value={selected.importScore ? `${selected.importScore}/5` : undefined} />
            <Field label="Valor estimado" value={currency.format(selected.estimatedValue)} />
            <Field label="Valor final" value={selected.finalValue ? currency.format(selected.finalValue) : undefined} />
            <Field label="Pagamento" value={selected.paymentStatus} />
            <Field label="Fechado em" value={selected.closedAt ? dateTime(selected.closedAt) : undefined} />
          </div>
        </section>

        {selected.personalizedMessage && <div className="detail-note"><span>Mensagem personalizada</span><p>{selected.personalizedMessage}</p>{selectedWhatsApp && <button type="button" className="detail-note__link detail-note__button" onClick={() => openWhatsAppFirstContact(selected)}><MessageCircle size={15} />Abrir WhatsApp com esta mensagem</button>}</div>}
        <div className="detail-note"><span>Observações comerciais</span><p>{selected.commercialNote ?? selected.notes ?? 'Sem observações.'}</p></div>
        {selected.lostReason && <div className="detail-note"><span>Motivo de perda</span><p>{selected.lostReason}</p></div>}
        <div className="detail-actions"><Button variant="secondary" onClick={() => setLeadStatus(selected, 'Futuro')}><RotateCcw size={16} />Retomar depois</Button><Button variant="secondary" onClick={() => setLeadStatus(selected, 'Perdido')}><XCircle size={16} />Marcar perdido</Button><Button onClick={() => setLeadStatus(selected, 'Fechado')}><CheckCircle2 size={16} />Marcar fechado</Button><Button variant="ghost" aria-label="Excluir lead" onClick={async () => { if (window.confirm(`Excluir ${selected.businessName}? Os dados relacionados também serão removidos.`)) { await deleteLead(selected.id); setSelected(null) } }}><Archive size={16} /></Button></div>
      </div>
    </Modal>}
  </div>
}
