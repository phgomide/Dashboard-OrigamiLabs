import { useState, type FormEvent } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { Lead } from '../types'
import { Button, Modal } from './ui'

export function LeadForm({ onClose }: { onClose: () => void }) {
  const { addLead } = useAppStore()
  const [form, setForm] = useState({ businessName: '', contactName: '', niche: '', source: 'Instagram', projectInterest: 'Origami Sites', estimatedValue: '897' })
  const field = (name: keyof typeof form, value: string) => setForm((current) => ({ ...current, [name]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.businessName.trim() || !form.niche.trim()) return
    const today = new Date().toISOString().slice(0, 10)
    const lead: Lead = { id: crypto.randomUUID(), businessName: form.businessName.trim(), contactName: form.contactName.trim() || undefined, niche: form.niche.trim(), source: form.source, city: 'São Paulo, SP', projectInterest: form.projectInterest, pipelineStatus: 'Novo lead', temperature: 'Morno', priority: 'Média', estimatedValue: Number(form.estimatedValue), paymentStatus: 'Não se aplica', nextActionDate: today, nextAction: 'Fazer primeiro contato', createdAt: today, updatedAt: today }
    await addLead(lead); onClose()
  }
  return <Modal title="Novo lead" onClose={onClose}><form className="form-grid" onSubmit={submit}><label className="form-field form-field--wide">Negócio ou profissional *<input autoFocus required value={form.businessName} onChange={(e) => field('businessName', e.target.value)} placeholder="Ex.: Studio Horizonte" /></label><label className="form-field">Contato<input value={form.contactName} onChange={(e) => field('contactName', e.target.value)} placeholder="Nome do contato" /></label><label className="form-field">Nicho *<input required value={form.niche} onChange={(e) => field('niche', e.target.value)} placeholder="Ex.: Fotografia" /></label><label className="form-field">Origem<select value={form.source} onChange={(e) => field('source', e.target.value)}><option>Instagram</option><option>Indicação</option><option>Google</option><option>Prospecção</option><option>Evento local</option></select></label><label className="form-field">Projeto<select value={form.projectInterest} onChange={(e) => field('projectInterest', e.target.value)}><option>Origami Sites</option><option>Origami Agenda</option><option>Origami Organize</option><option>Site + Agenda</option><option>Agenda + Organize</option><option>Projeto personalizado</option></select></label><label className="form-field form-field--wide">Valor estimado<input type="number" min="397" step="50" value={form.estimatedValue} onChange={(e) => field('estimatedValue', e.target.value)} /></label><div className="form-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Cadastrar lead</Button></div></form></Modal>
}
