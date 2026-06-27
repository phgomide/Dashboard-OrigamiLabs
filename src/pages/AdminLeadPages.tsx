import { AlertCircle, CheckCircle2, FileJson, RefreshCcw, Search, Upload, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '../components/ui'
import type { LeadImportPreviewRow, LeadImportSummary, OrigamiLead, OrigamiLeadStatus } from '../types'
import { importOrigamiLeads, listOrigamiLeads, ORIGAMI_LEAD_STATUSES, previewOrigamiLeadImport, previewSummary, updateOrigamiLeadStatus } from '../services/origamiLeads'

const exampleJson = `[
  {
    "nome_negocio": "Padaria Central",
    "nome_dono": "Marina Alves",
    "cidade": "Belo Horizonte",
    "google_maps_url": "https://maps.google.com/?cid=123",
    "telefone": "3133334444",
    "whatsapp": "31999990000",
    "instagram": "@padariacentral",
    "site": "",
    "nicho": "Alimentacao",
    "oportunidade": "Site institucional",
    "score": 4,
    "observacao_comercial": "Bom volume de avaliacoes e sem site proprio."
  }
]`

const statusLabels: Record<OrigamiLeadStatus, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  respondeu: 'Respondeu',
  interessado: 'Interessado',
  proposta_enviada: 'Proposta enviada',
  fechado: 'Fechado',
  perdido: 'Perdido',
  sem_resposta: 'Sem resposta',
}

const actionTone = {
  criar: 'success',
  atualizar: 'primary',
  ignorar: 'neutral',
  erro: 'danger',
} as const

function SummaryCards({ summary }: { summary: LeadImportSummary }) {
  return <div className="import-summary">
    <div><span>Criar</span><strong>{summary.created}</strong></div>
    <div><span>Atualizar</span><strong>{summary.updated}</strong></div>
    <div><span>Ignorar</span><strong>{summary.ignored}</strong></div>
    <div><span>Erros</span><strong>{summary.errors}</strong></div>
  </div>
}

function actionLabel(row: LeadImportPreviewRow) {
  if (row.action === 'erro') return row.errors.join(' ')
  if (row.action === 'criar') return 'Novo lead sera criado.'
  if (row.action === 'atualizar') return `Atualiza ${Object.keys(row.updatePatch ?? {}).join(', ')}.`
  return 'Lead duplicado sem campos vazios para preencher.'
}

export function AdminLeadImportPage() {
  const [json, setJson] = useState(exampleJson)
  const [overwrite, setOverwrite] = useState(false)
  const [rows, setRows] = useState<LeadImportPreviewRow[]>([])
  const [summary, setSummary] = useState<LeadImportSummary | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const currentSummary = rows.length > 0 ? previewSummary(rows) : summary
  const hasErrors = rows.some((row) => row.action === 'erro')

  const validate = async () => {
    setLoading(true)
    setMessage('')
    setSummary(null)
    try {
      const preview = await previewOrigamiLeadImport(json, overwrite)
      setRows(preview)
      setMessage('JSON validado. Confira a previa antes de importar.')
    } catch (error) {
      setRows([])
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel validar o JSON.')
    } finally {
      setLoading(false)
    }
  }

  const importRows = async () => {
    setLoading(true)
    setMessage('')
    try {
      const result = await importOrigamiLeads(json, overwrite)
      setRows(result.rows)
      setSummary(result.summary)
      setMessage('Importacao concluida.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel importar os leads.')
    } finally {
      setLoading(false)
    }
  }

  const loadFile = async (file: File | null) => {
    if (!file) return
    setJson(await file.text())
    setRows([])
    setSummary(null)
    setMessage(`${file.name} carregado.`)
  }

  return <div className="page"><section className="page-heading"><div><span className="eyebrow">Prospecao interna</span><h1>Importar leads por JSON</h1><p>Valide uma lista manual, revise duplicidades e grave apenas o que faz sentido.</p></div><Link className="button button--secondary" to="/admin/leads"><Search size={16} />Ver base</Link></section>
    <section className="import-layout">
      <article className="panel import-editor">
        <header className="panel__header"><div><span className="eyebrow">Entrada</span><h2>JSON manual</h2></div><FileJson size={19} /></header>
        <textarea className="json-input" value={json} onChange={(event) => { setJson(event.target.value); setRows([]); setSummary(null) }} spellCheck={false} aria-label="JSON de leads" />
        <div className="import-actions">
          <label className="file-button"><Upload size={16} />Carregar .json<input type="file" accept="application/json,.json" onChange={(event) => void loadFile(event.target.files?.[0] ?? null)} /></label>
          <label className="overwrite-toggle"><input type="checkbox" checked={overwrite} onChange={(event) => { setOverwrite(event.target.checked); setRows([]); setSummary(null) }} /> Sobrescrever dados existentes</label>
          <Button variant="secondary" onClick={() => void validate()} disabled={loading}><Wand2 size={16} />Validar</Button>
          <Button onClick={() => void importRows()} disabled={loading || rows.length === 0 || hasErrors}><CheckCircle2 size={16} />Importar</Button>
        </div>
        {message && <p className={message.includes('Nao') || message.includes('precisa') ? 'settings-message settings-message--error' : 'settings-message'}>{message}</p>}
      </article>
      <aside className="panel import-example">
        <header className="panel__header"><div><span className="eyebrow">Modelo</span><h2>Campos aceitos</h2></div></header>
        <pre>{exampleJson}</pre>
      </aside>
    </section>
    {currentSummary && <SummaryCards summary={currentSummary} />}
    <section className="panel table-panel">
      <div className="table-toolbar"><span><strong className="toolbar-title">Previa da importacao</strong><small className="toolbar-subtitle">A acao final e calculada antes de gravar no Supabase.</small></span><Button variant="secondary" onClick={() => void validate()} disabled={loading}><RefreshCcw size={16} />Revalidar</Button></div>
      <div className="data-table-wrap"><table className="data-table import-preview-table"><thead><tr><th>Linha</th><th>Acao</th><th>Negocio</th><th>Cidade</th><th>Nicho</th><th>Oportunidade</th><th>Score</th><th>Detalhe</th></tr></thead><tbody>{rows.map((row) => <tr key={row.index}><td>{row.index + 1}</td><td><Badge tone={actionTone[row.action]}>{row.action}</Badge></td><td>{row.input?.nomeNegocio ?? '-'}</td><td>{row.input?.cidade ?? '-'}</td><td>{row.input?.nicho ?? '-'}</td><td>{row.input?.oportunidade ?? '-'}</td><td>{row.input?.score ?? '-'}</td><td className={row.action === 'erro' ? 'row-error' : ''}>{actionLabel(row)}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="table-empty">Cole ou carregue um JSON e valide para ver a previa.</div>}</div>
    </section>
  </div>
}

export function AdminLeadsPage() {
  const [leads, setLeads] = useState<OrigamiLead[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('todos')
  const [niche, setNiche] = useState('todos')
  const [opportunity, setOpportunity] = useState('todos')
  const [score, setScore] = useState('todos')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    setMessage('')
    try {
      setLeads(await listOrigamiLeads())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar a base.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const filtered = useMemo(() => leads.filter((lead) => {
    const text = `${lead.nomeNegocio} ${lead.nomeDono ?? ''} ${lead.cidade} ${lead.nicho} ${lead.oportunidade}`.toLowerCase()
    return text.includes(query.toLowerCase())
      && (status === 'todos' || lead.status === status)
      && (niche === 'todos' || lead.nicho === niche)
      && (opportunity === 'todos' || lead.oportunidade === opportunity)
      && (score === 'todos' || String(lead.score) === score)
  }), [leads, niche, opportunity, query, score, status])

  const niches = ['todos', ...new Set(leads.map((lead) => lead.nicho))]
  const opportunities = ['todos', ...new Set(leads.map((lead) => lead.oportunidade))]
  const scores = ['todos', '5', '4', '3', '2', '1']

  const changeStatus = async (lead: OrigamiLead, nextStatus: OrigamiLeadStatus) => {
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: nextStatus } : item))
    try {
      const updated = await updateOrigamiLeadStatus(lead.id, nextStatus)
      setLeads((current) => current.map((item) => item.id === lead.id ? updated : item))
    } catch (error) {
      setLeads((current) => current.map((item) => item.id === lead.id ? lead : item))
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel atualizar o status.')
    }
  }

  return <div className="page"><section className="page-heading"><div><span className="eyebrow">Base interna</span><h1>Leads Origami</h1><p><strong>{leads.length} negocios</strong> vindos de pesquisa manual e importacao JSON.</p></div><Link className="button button--primary" to="/admin/leads/import"><Upload size={16} />Importar JSON</Link></section>
    {message && <p className="settings-message settings-message--error"><AlertCircle size={14} /> {message}</p>}
    <section className="panel table-panel">
      <div className="table-toolbar"><label className="table-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por negocio, dono, cidade ou nicho" /></label><div className="table-filters"><label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status"><option value="todos">Todos os status</option>{ORIGAMI_LEAD_STATUSES.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}</select></label><label><select value={niche} onChange={(event) => setNiche(event.target.value)} aria-label="Filtrar por nicho">{niches.map((item) => <option key={item} value={item}>{item === 'todos' ? 'Todos os nichos' : item}</option>)}</select></label><label><select value={opportunity} onChange={(event) => setOpportunity(event.target.value)} aria-label="Filtrar por oportunidade">{opportunities.map((item) => <option key={item} value={item}>{item === 'todos' ? 'Todas oportunidades' : item}</option>)}</select></label><label><select value={score} onChange={(event) => setScore(event.target.value)} aria-label="Filtrar por score">{scores.map((item) => <option key={item} value={item}>{item === 'todos' ? 'Todos scores' : item}</option>)}</select></label></div></div>
      <div className="data-table-wrap"><table className="data-table admin-leads-table"><thead><tr><th>Negocio</th><th>Cidade</th><th>Nicho</th><th>Oportunidade</th><th>Score</th><th>Contato</th><th>Canais</th><th>Status</th><th>Nota</th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id}><td><div className="lead-cell"><span className="business-avatar">{lead.nomeNegocio.slice(0, 2).toUpperCase()}</span><span><strong>{lead.nomeNegocio}</strong><small>{lead.nomeDono ?? 'Dono nao informado'}</small></span></div></td><td>{lead.cidade}</td><td>{lead.nicho}</td><td><strong className="table-primary">{lead.oportunidade}</strong></td><td><Badge tone={lead.score >= 4 ? 'success' : lead.score === 3 ? 'warning' : 'neutral'}>{lead.score}/5</Badge></td><td><strong className="table-primary">{lead.telefone ?? '-'}</strong><small className="table-secondary">{lead.whatsapp ?? '-'}</small></td><td className="channel-links">{lead.instagram ? <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">Instagram</a> : <span>-</span>}{lead.site ? <a href={lead.site} target="_blank" rel="noreferrer">Site</a> : null}{lead.googleMapsUrl ? <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer">Maps</a> : null}</td><td><select className="status-select" value={lead.status} onChange={(event) => void changeStatus(lead, event.target.value as OrigamiLeadStatus)}>{ORIGAMI_LEAD_STATUSES.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}</select></td><td><small className="table-secondary">{lead.observacaoComercial ?? '-'}</small></td></tr>)}</tbody></table>{!loading && filtered.length === 0 && <div className="table-empty">Nenhum lead encontrado com esses filtros.</div>}{loading && <div className="table-empty">Carregando leads...</div>}</div>
      <footer className="table-footer"><span>Exibindo {filtered.length} de {leads.length} leads</span><Button variant="secondary" onClick={() => void refresh()}><RefreshCcw size={15} />Atualizar</Button></footer>
    </section>
  </div>
}
