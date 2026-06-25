import type { Activity, Lead, Project, Proposal } from '../types'

const lead = (
  id: string,
  businessName: string,
  niche: string,
  projectInterest: string,
  pipelineStatus: Lead['pipelineStatus'],
  temperature: Lead['temperature'],
  estimatedValue: number,
  source: string,
  nextActionDate: string,
  overrides: Partial<Lead> = {},
): Lead => ({
  id,
  businessName,
  contactName: overrides.contactName,
  niche,
  source,
  city: overrides.city ?? 'São Paulo, SP',
  publicLink: overrides.publicLink ?? '@' + businessName.toLowerCase().replace(/[^a-z0-9]/g, ''),
  projectInterest,
  pipelineStatus,
  temperature,
  priority: temperature === 'Quente' ? 'Alta' : temperature === 'Morno' ? 'Média' : 'Baixa',
  estimatedValue,
  finalValue: overrides.finalValue,
  paymentStatus: overrides.paymentStatus ?? 'Não se aplica',
  nextActionDate,
  nextAction: overrides.nextAction ?? 'Fazer follow-up',
  notes: overrides.notes ?? 'Lead qualificado durante a prospecção da semana.',
  lostReason: overrides.lostReason,
  createdAt: overrides.createdAt ?? '2026-06-02',
  updatedAt: overrides.updatedAt ?? '2026-06-23',
  closedAt: overrides.closedAt,
})

export const initialLeads: Lead[] = [
  lead('l1', 'PetClean', 'Petshop', 'Origami Organize', 'Negociação', 'Quente', 1890, 'Indicação', '2026-06-24', { contactName: 'Marina Costa', nextAction: 'Alinhar escopo final' }),
  lead('l2', 'Dra. Clara Moreira', 'Psicologia', 'Site + Agenda', 'Proposta enviada', 'Quente', 2200, 'Instagram', '2026-06-25', { city: 'Campinas, SP', contactName: 'Clara Moreira', nextAction: 'Confirmar leitura da proposta' }),
  lead('l3', 'Barbearia Brava', 'Barbearia', 'Agenda + Organize', 'Reunião marcada', 'Morno', 2500, 'Prospecção', '2026-06-24', { contactName: 'Rafael Nunes', nextAction: 'Reunião de diagnóstico às 15h' }),
  lead('l4', 'Flora Atelier', 'Floricultura', 'Origami Organize', 'Conversando', 'Quente', 1490, 'Instagram', '2026-06-26', { contactName: 'Bianca Lima', nextAction: 'Enviar referência do painel' }),
  lead('l5', 'Ciclo Norte', 'Oficina de bicicletas', 'Origami Organize', 'Diagnóstico feito', 'Morno', 1650, 'Google', '2026-06-27', { contactName: 'André Lopes', nextAction: 'Montar proposta personalizada' }),
  lead('l6', 'Caio Studio', 'Design', 'Origami Sites', 'Fechado', 'Quente', 897, 'Indicação', '2026-07-02', { finalValue: 897, paymentStatus: 'Pago', contactName: 'Caio Martins', closedAt: '2026-06-14', nextAction: 'Enviar primeira versão' }),
  lead('l7', 'Doce Aurora', 'Confeitaria', 'Origami Organize', 'Primeiro contato', 'Morno', 1290, 'Evento local', '2026-06-28', { contactName: 'Luana Reis' }),
  lead('l8', 'AutoBrilho', 'Lava-jato', 'Origami Organize', 'Perdido', 'Frio', 1190, 'Prospecção', '2026-09-10', { contactName: 'Diego Alves', lostReason: 'Momento financeiro', nextAction: 'Retomar em setembro' }),
  lead('l9', 'Move com Ana', 'Personal trainer', 'Origami Agenda', 'Novo lead', 'Morno', 697, 'Instagram', '2026-06-25', { contactName: 'Ana Paula' }),
  lead('l10', 'Açaí do Ponto', 'Alimentação', 'Origami Organize', 'Futuro', 'Frio', 1390, 'Indicação', '2026-08-05', { contactName: 'Pedro Lima', nextAction: 'Retomar após reforma' }),
  lead('l11', 'Lumière Estética', 'Estética', 'Origami Agenda', 'Fechado', 'Quente', 997, 'Google', '2026-06-26', { finalValue: 997, paymentStatus: 'Parcial', contactName: 'Renata Melo', closedAt: '2026-06-20', nextAction: 'Cobrar parcela final' }),
  lead('l12', 'Tecfix', 'Assistência técnica', 'Projeto personalizado', 'Proposta enviada', 'Morno', 2450, 'LinkedIn', '2026-06-29', { contactName: 'Fábio Rosa', nextAction: 'Revisar escopo da proposta' }),
]

export const initialActivities: Activity[] = [
  { id: 'a1', leadId: 'l3', title: 'Diagnóstico comercial', type: 'Reunião', date: '2026-06-24', time: '15:00', status: 'Pendente', priority: 'Alta', description: 'Entender agenda atual e rotina financeira.' },
  { id: 'a2', leadId: 'l1', title: 'Alinhar escopo do dashboard', type: 'Follow-up', date: '2026-06-24', time: '10:30', status: 'Pendente', priority: 'Alta' },
  { id: 'a3', leadId: 'l2', title: 'Confirmar proposta recebida', type: 'Follow-up', date: '2026-06-25', time: '09:00', status: 'Pendente', priority: 'Alta' },
  { id: 'a4', leadId: 'l11', title: 'Lembrete da parcela final', type: 'Cobrança', date: '2026-06-26', time: '11:00', status: 'Pendente', priority: 'Média' },
  { id: 'a5', leadId: 'l4', title: 'Enviar referência visual', type: 'Envio de proposta', date: '2026-06-23', time: '16:00', status: 'Atrasada', priority: 'Média' },
  { id: 'a6', leadId: 'l6', title: 'Receber conteúdo da landing', type: 'Entrega', date: '2026-06-27', time: '14:00', status: 'Pendente', priority: 'Média' },
]

export const initialProposals: Proposal[] = [
  { id: 'p1', leadId: 'l2', projectType: 'Site + Agenda', planName: 'Presença completa', value: 2200, status: 'Enviada', sentAt: '2026-06-21', validUntil: '2026-06-30', probability: 80 },
  { id: 'p2', leadId: 'l12', projectType: 'Projeto personalizado', planName: 'Operação Pro', value: 2450, status: 'Em negociação', sentAt: '2026-06-19', validUntil: '2026-07-03', probability: 65 },
  { id: 'p3', leadId: 'l5', projectType: 'Origami Organize', planName: 'Essencial', value: 1650, status: 'Rascunho', validUntil: '2026-07-06', probability: 55 },
  { id: 'p4', leadId: 'l6', projectType: 'Origami Sites', planName: 'Landing Start', value: 897, status: 'Aceita', sentAt: '2026-06-11', validUntil: '2026-06-18', probability: 100 },
  { id: 'p5', leadId: 'l8', projectType: 'Origami Organize', planName: 'Essencial', value: 1190, status: 'Recusada', sentAt: '2026-06-08', validUntil: '2026-06-15', probability: 0 },
]

export const initialProjects: Project[] = [
  { id: 'j1', leadId: 'l6', projectType: 'Origami Sites', value: 897, status: 'Em desenvolvimento', currentStage: 'Design', paymentStatus: 'Pago', startedAt: '2026-06-17', deadline: '2026-07-08' },
  { id: 'j2', leadId: 'l11', projectType: 'Origami Agenda', value: 997, status: 'Aguardando início', currentStage: 'Briefing', paymentStatus: 'Parcial', startedAt: '2026-06-25', deadline: '2026-07-15' },
  { id: 'j3', leadId: 'l13', projectType: 'Origami Organize', value: 2150, status: 'Revisão', currentStage: 'Revisão', paymentStatus: 'Pendente', startedAt: '2026-05-28', deadline: '2026-06-28', notes: 'Painel interno para gestão de pedidos.' },
  { id: 'j4', leadId: 'l14', projectType: 'Origami Sites', value: 1290, status: 'Entregue', currentStage: 'Entrega final', paymentStatus: 'Pago', startedAt: '2026-05-05', deadline: '2026-05-30' },
]

export const leadTrend = [
  { month: 'Jan', leads: 8 }, { month: 'Fev', leads: 12 }, { month: 'Mar', leads: 10 },
  { month: 'Abr', leads: 16 }, { month: 'Mai', leads: 21 }, { month: 'Jun', leads: 27 },
]

export const revenueTrend = [
  { month: 'Jan', prevista: 4200, fechada: 2600 }, { month: 'Fev', prevista: 5100, fechada: 3300 },
  { month: 'Mar', prevista: 4700, fechada: 3800 }, { month: 'Abr', prevista: 6900, fechada: 4900 },
  { month: 'Mai', prevista: 8200, fechada: 6100 }, { month: 'Jun', prevista: 10500, fechada: 7340 },
]

export const projectMix = [
  { name: 'Sites', value: 35, color: '#5B7CFF' },
  { name: 'Organize', value: 31, color: '#7C5CFF' },
  { name: 'Agenda', value: 22, color: '#22A06B' },
  { name: 'Combos', value: 12, color: '#F59E0B' },
]

export const sourceMix = [
  { name: 'Instagram', value: 38 }, { name: 'Indicação', value: 27 },
  { name: 'Prospecção', value: 18 }, { name: 'Google', value: 11 }, { name: 'Outros', value: 6 },
]
