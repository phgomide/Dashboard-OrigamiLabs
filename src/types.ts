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
export type OutreachStatus = 'rascunho_gerado' | 'abordado_manual' | 'followup_1_sugerido' | 'followup_1_enviado_manual' | 'followup_2_sugerido' | 'followup_2_enviado_manual' | 'pausado' | 'nao_contatar'
export type ResponseStatus = 'nao_abordado' | 'sem_resposta' | 'respondeu' | 'pediu_informacoes' | 'reuniao_marcada' | 'resposta_negativa' | 'nao_contatar'
export type ConversionStatus = 'nao_iniciado' | 'em_conversa' | 'reuniao_marcada' | 'proposta_enviada' | 'convertido' | 'perdido'

export interface Lead {
  id: string
  businessName: string
  contactName?: string
  niche: string
  source: string
  city: string
  publicLink?: string
  ownerName?: string
  googleMapsUrl?: string
  phone?: string
  whatsapp?: string
  instagram?: string
  website?: string
  commercialNote?: string
  personalizedMessage?: string
  whatsappUrl?: string
  importScore?: number
  importOrigin?: string
  automationDedupeKey?: string
  projectInterest: string
  pipelineStatus: PipelineStatus
  temperature: LeadTemperature
  priority: Priority
  estimatedValue: number
  finalValue?: number
  paymentStatus: PaymentStatus
  outreachStatus?: OutreachStatus
  responseStatus?: ResponseStatus
  conversionStatus?: ConversionStatus
  firstTouchAt?: string
  lastFollowupAt?: string
  nextFollowupDate?: string
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

export type OrigamiLeadStatus =
  | 'novo'
  | 'contatado'
  | 'respondeu'
  | 'interessado'
  | 'proposta_enviada'
  | 'fechado'
  | 'perdido'
  | 'sem_resposta'

export interface OrigamiLead {
  id: string
  nomeNegocio: string
  nomeDono: string | null
  cidade: string
  googleMapsUrl: string | null
  telefone: string | null
  whatsapp: string | null
  instagram: string | null
  site: string | null
  nicho: string
  oportunidade: string
  score: number
  observacaoComercial: string | null
  status: OrigamiLeadStatus
  origem: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface OrigamiLeadInput {
  nomeNegocio: string
  nomeDono: string | null
  cidade: string
  googleMapsUrl: string | null
  telefone: string | null
  whatsapp: string | null
  instagram: string | null
  site: string | null
  nicho: string
  oportunidade: string
  score: number
  observacaoComercial: string | null
  status: OrigamiLeadStatus
  origem: string
}

export type LeadImportAction = 'criar' | 'atualizar' | 'ignorar' | 'erro'

export interface LeadImportPreviewRow {
  index: number
  action: LeadImportAction
  input?: OrigamiLeadInput
  existing?: OrigamiLead
  updatePatch?: Partial<OrigamiLeadInput>
  errors: string[]
}

export interface LeadImportSummary {
  created: number
  updated: number
  ignored: number
  errors: number
}
