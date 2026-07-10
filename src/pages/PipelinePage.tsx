import { DndContext, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CalendarClock, ChevronRight, Flame, GripVertical, Move, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, Modal } from '../components/ui'
import { currency, shortDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { Lead, PipelineStatus } from '../types'

const columns: PipelineStatus[] = ['Primeiro contato','Conversando','Reunião marcada','Diagnóstico feito','Proposta enviada','Negociação','Fechado','Perdido','Futuro']
const allPipelineStatuses: PipelineStatus[] = ['Novo lead', ...columns]
type BoardPosition = { x: number; y: number }
type BoardLayout = Record<PipelineStatus, BoardPosition>
const layoutKey = 'origami-pipeline-layout-v2-no-new-lead'

function defaultLayout(): BoardLayout {
  return Object.fromEntries(columns.map((status, index) => [status, { x: (index % 4) * 280, y: Math.floor(index / 4) * 360 }])) as BoardLayout
}

function loadLayout(): BoardLayout {
  try {
    const saved = JSON.parse(localStorage.getItem(layoutKey) ?? 'null') as Partial<BoardLayout> | null
    return { ...defaultLayout(), ...(saved ?? {}) }
  } catch {
    return defaultLayout()
  }
}

function PipelineCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  return <article ref={setNodeRef} className={isDragging ? 'kanban-card kanban-card--dragging' : 'kanban-card'} style={{ transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined }} onClick={onOpen}><button className="kanban-card__grip" aria-label={`Arrastar ${lead.businessName}`} {...listeners} {...attributes}><GripVertical size={14} /></button><div className="kanban-card__top"><Badge tone={lead.temperature === 'Quente' ? 'danger' : lead.temperature === 'Morno' ? 'warning' : 'neutral'}>{lead.temperature === 'Quente' && <Flame size={11} />}{lead.temperature}</Badge><small>{lead.priority}</small></div><h3>{lead.businessName}</h3><p>{lead.niche} · {lead.projectInterest}</p><strong>{currency.format(lead.estimatedValue)}</strong><div className="kanban-card__action"><CalendarClock size={13} /><span><strong>{lead.nextAction}</strong><small>{shortDate(lead.nextActionDate)}</small></span></div></article>
}

function PipelineColumn({ status, leads, onOpen, position }: { status: PipelineStatus; leads: Lead[]; onOpen: (lead: Lead) => void; position: BoardPosition }) {
  const droppable = useDroppable({ id: status })
  const draggable = useDraggable({ id: `column:${status}` })
  const total = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0)
  const x = position.x + (draggable.transform?.x ?? 0)
  const y = position.y + (draggable.transform?.y ?? 0)
  return <section ref={(node) => { droppable.setNodeRef(node); draggable.setNodeRef(node) }} className={`${droppable.isOver ? 'kanban-column kanban-column--over' : 'kanban-column'} ${draggable.isDragging ? 'kanban-column--moving' : ''}`} style={{ transform: `translate3d(${x}px,${y}px,0)` }}><header><div><span className={`status-dot status-dot--${status.replaceAll(' ','-').toLowerCase()}`} /><h2>{status === 'Futuro' ? 'Futuro / retomar' : status}</h2><em>{leads.length}</em></div><button className="kanban-column__move" aria-label={`Mover coluna ${status}`} {...draggable.listeners} {...draggable.attributes}><Move size={14} /></button><strong>{currency.format(total)}</strong></header><div className="kanban-column__cards">{leads.map((lead) => <PipelineCard key={lead.id} lead={lead} onOpen={() => onOpen(lead)} />)}{leads.length === 0 && <div className="kanban-empty">Solte um lead aqui</div>}</div></section>
}

export function PipelinePage() {
  const { leads, moveLead, updateLead } = useAppStore()
  const [selected, setSelected] = useState<Lead | null>(null)
  const [layout, setLayout] = useState<BoardLayout>(() => loadLayout())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 5 } }))
  useEffect(() => { localStorage.setItem(layoutKey, JSON.stringify(layout)) }, [layout])
  useEffect(() => {
    const now = Date.now()
    const staleAfterMs = 7 * 24 * 60 * 60 * 1000
    leads
      .filter((lead) => lead.pipelineStatus === 'Primeiro contato' && (lead.responseStatus ?? 'sem_resposta') === 'sem_resposta' && lead.firstTouchAt && now - new Date(lead.firstTouchAt).getTime() >= staleAfterMs)
      .forEach((lead) => {
        updateLead(lead.id, {
          pipelineStatus: 'Futuro',
          outreachStatus: lead.outreachStatus ?? 'abordado_manual',
          responseStatus: 'sem_resposta',
          nextAction: 'Sem resposta após 7 dias; retomar só se fizer sentido',
          nextActionDate: undefined,
        })
      })
  }, [leads, updateLead])
  const boardHeight = Math.max(760, ...Object.values(layout).map((position) => position.y + 330))
  const resetLayout = () => setLayout(defaultLayout())
  const onDragEnd = ({ active, delta, over }: DragEndEvent) => {
    const activeId = String(active.id)
    if (activeId.startsWith('column:')) {
      const status = activeId.replace('column:', '') as PipelineStatus
      setLayout((current) => ({ ...current, [status]: { x: Math.max(0, current[status].x + delta.x), y: Math.max(0, current[status].y + delta.y) } }))
      return
    }
    if (over && columns.includes(over.id as PipelineStatus)) moveLead(activeId, over.id as PipelineStatus)
  }
  return <div className="page page--wide"><section className="page-heading"><div><span className="eyebrow">Jornada comercial</span><h1>Pipeline</h1><p>Arraste os leads depois do primeiro contato. A coluna Novo lead fica fora do Kanban para não poluir o pipeline.</p></div><div className="pipeline-total"><span>Valor total no funil</span><strong>{currency.format(leads.filter((l) => !['Perdido','Fechado'].includes(l.pipelineStatus)).reduce((sum,l) => sum + l.estimatedValue,0))}</strong><Button variant="secondary" onClick={resetLayout}><RotateCcw size={15} />Organizar</Button></div></section><DndContext sensors={sensors} onDragEnd={onDragEnd}><div className="kanban-board kanban-board--free" style={{ height: boardHeight }}>{columns.map((status) => <PipelineColumn key={status} status={status} position={layout[status]} leads={leads.filter((lead) => lead.pipelineStatus === status)} onOpen={setSelected} />)}</div></DndContext>
    {selected && <Modal title={selected.businessName} onClose={() => setSelected(null)} size="lg"><div className="lead-detail"><div className="lead-detail__summary"><span className="business-avatar business-avatar--large">{selected.businessName.slice(0,2).toUpperCase()}</span><div><h3>{selected.businessName}</h3><p>{selected.niche} · {selected.city}</p></div><strong>{currency.format(selected.estimatedValue)}</strong></div><label className="form-field">Etapa do pipeline<select value={selected.pipelineStatus} onChange={(e) => { const status = e.target.value as PipelineStatus; moveLead(selected.id,status); setSelected({ ...selected,pipelineStatus: status }) }}>{allPipelineStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><div className="detail-grid"><div><span>Projeto</span><strong>{selected.projectInterest}</strong></div><div><span>Temperatura</span><strong>{selected.temperature}</strong></div><div><span>Próxima ação</span><strong>{selected.nextAction}</strong></div><div><span>Data</span><strong>{shortDate(selected.nextActionDate)}</strong></div></div><div className="history"><span className="eyebrow">Histórico</span><div><i /><p><strong>Lead atualizado</strong><small>Movido para {selected.pipelineStatus} · {shortDate(selected.updatedAt)}</small></p></div><div><i /><p><strong>Interesse registrado</strong><small>{selected.projectInterest} · {shortDate(selected.createdAt)}</small></p></div></div><button className="pipeline-next" onClick={() => { const index = columns.indexOf(selected.pipelineStatus); const next = columns[Math.min(index + 1, columns.length - 1)]; moveLead(selected.id,next); setSelected({...selected,pipelineStatus:next}) }}>Avançar para próxima etapa<ChevronRight size={17} /></button></div></Modal>}
  </div>
}
