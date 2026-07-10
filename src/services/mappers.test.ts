import { describe, expect, it } from 'vitest'
import { leadFromRow, leadToRow } from './mappers'

describe('lead database mapper', () => {
  it('maps snake_case database rows to the UI contract', () => {
    const lead = leadFromRow({ id:'1', business_name:'PetClean', contact_name:null, niche:'Petshop', source:'Indicação', city:'São Paulo, SP', public_link:'https://maps.google.com/example', owner_name:'Marina', google_maps_url:'https://maps.google.com/?cid=1', phone:'83999990001', whatsapp:'5583999990001', instagram:'@petclean', website:'https://petclean.test', commercial_note:'Boa oportunidade', personalized_message:'Oi, vi o perfil da PetClean...', whatsapp_url:'https://wa.me/5583999990001?text=Oi', import_score:5, import_origin:'origami-leads-n8n', project_interest:'Origami Organize', pipeline_status:'Novo lead', lead_temperature:'Quente', priority:'Alta', estimated_value:'1497.00', final_value:null, payment_status:'Pendente', next_action_date:'2026-06-25', next_action:'Contato', notes:null, lost_reason:null, created_at:'2026-06-24T10:00:00Z', updated_at:'2026-06-24T10:00:00Z', closed_at:null })
    expect(lead.businessName).toBe('PetClean')
    expect(lead.estimatedValue).toBe(1497)
    expect(lead.contactName).toBeUndefined()
    expect(lead.city).toBe('São Paulo, SP')
    expect(lead.ownerName).toBe('Marina')
    expect(lead.googleMapsUrl).toBe('https://maps.google.com/?cid=1')
    expect(lead.personalizedMessage).toContain('PetClean')
    expect(lead.whatsappUrl).toBe('https://wa.me/5583999990001?text=Oi')
    expect(lead.importOrigin).toBe('origami-leads-n8n')
  })

  it('only emits allowed writable database fields', () => {
    const row = leadToRow({ id:'client-id', businessName:' PetClean ', niche:'Petshop', source:'Indicação', city:'São Paulo', projectInterest:'Origami Organize', pipelineStatus:'Novo lead', temperature:'Quente', priority:'Alta', estimatedValue:1497, paymentStatus:'Pendente', createdAt:'ignored', updatedAt:'ignored' })
    expect(row.business_name).toBe('PetClean')
    expect(row).not.toHaveProperty('id')
    expect(row).not.toHaveProperty('created_at')
  })
})
