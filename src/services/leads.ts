import type { Lead } from '../types'
import { leadFromRow, leadToRow } from './mappers'
import { assertNoError, requireSupabase } from './repository'

export async function listLeads(){ const {data,error}=await requireSupabase().from('leads').select('*').order('created_at',{ascending:false}); assertNoError(error); return (data??[]).map(leadFromRow) }
export async function createLead(value:Lead){ const {data,error}=await requireSupabase().from('leads').insert(leadToRow(value)).select().single(); assertNoError(error); return leadFromRow(data as Record<string,unknown>) }
export async function updateLead(id:string,patch:Partial<Lead>,current:Lead){ const {data,error}=await requireSupabase().from('leads').update(leadToRow({...current,...patch})).eq('id',id).select().single(); assertNoError(error); return leadFromRow(data as Record<string,unknown>) }
export async function deleteLead(id:string){ const {error}=await requireSupabase().from('leads').delete().eq('id',id); assertNoError(error) }
