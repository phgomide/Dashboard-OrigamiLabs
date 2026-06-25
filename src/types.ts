export type PipelineStatus =
  | 'Novo lead'
  | 'Primeiro contato'
  | 'Conversando'
  | 'Reunião marcada'
  | 'Diagnóstico feito'
  | 'Proposta enviada'
  | 'Negociação'
  | 'Fechado'
  | 'Perdido'
  | 'Futuro'

export type LeadTemperature = 'Quente' | 'Morno' | 'Frio'
export type Priority = 'Alta' | 'Média' | 'Baixa'
export type PaymentStatus = 'Não se aplica' | 'Pendente' | 'Parcial' | 'Pago'

export interface Lead {
  id: string
  businessName: string
  contactName?: string
  niche: string
  source: string
  city: string
  publicLink?: string
  projectInterest: string
  pipelineStatus: PipelineStatus
  temperature: LeadTemperature
  priority: Priority
  estimatedValue: number
  finalValue?: number
  paymentStatus: PaymentStatus
  nextActionDate?: string
  nextAction?: string
  notes?: string
  lostReason?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
}

export interface Activity {
  id: string
  leadId: string
  title: string
  type: 'Primeiro contato' | 'Reunião' | 'Follow-up' | 'Envio de proposta' | 'Revisão' | 'Cobrança' | 'Entrega' | 'Retomada'
  date: string
  time: string
  status: 'Pendente' | 'Concluída' | 'Atrasada' | 'Cancelada'
  priority: Priority
  description?: string
}

export interface Proposal {
  id: string
  leadId: string
  projectType: string
  planName: string
  value: number
  status: 'Rascunho' | 'Enviada' | 'Em negociação' | 'Aceita' | 'Recusada' | 'Expirada'
  sentAt?: string
  validUntil: string
  probability: number
  notes?: string
}

export interface Project {
  id: string
  leadId: string
  projectType: string
  value: number
  status: 'Aguardando início' | 'Em desenvolvimento' | 'Revisão' | 'Ajustes finais' | 'Entregue' | 'Pausado' | 'Cancelado'
  currentStage: 'Briefing' | 'Estrutura' | 'Design' | 'Desenvolvimento' | 'Revisão' | 'Publicação' | 'Entrega final'
  paymentStatus: PaymentStatus
  startedAt: string
  deadline: string
  notes?: string
}
