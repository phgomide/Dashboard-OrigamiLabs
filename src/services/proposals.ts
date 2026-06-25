import type { Proposal } from '../types'
import { proposalFromRow, proposalToRow } from './mappers'
import { assertNoError, requireSupabase } from './repository'
export async function listProposals(){const{data,error}=await requireSupabase().from('proposals').select('*').order('created_at',{ascending:false});assertNoError(error);return(data??[]).map(proposalFromRow)}
export async function createProposal(value:Proposal){const{data,error}=await requireSupabase().from('proposals').insert(proposalToRow(value)).select().single();assertNoError(error);return proposalFromRow(data as Record<string,unknown>)}
export async function updateProposal(id:string,value:Proposal){const{data,error}=await requireSupabase().from('proposals').update(proposalToRow(value)).eq('id',id).select().single();assertNoError(error);return proposalFromRow(data as Record<string,unknown>)}
export async function deleteProposal(id:string){const{error}=await requireSupabase().from('proposals').delete().eq('id',id);assertNoError(error)}
