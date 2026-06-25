import type { Activity } from '../types'
import { activityFromRow, activityToRow } from './mappers'
import { assertNoError, requireSupabase } from './repository'
export async function listActivities(){const{data,error}=await requireSupabase().from('activities').select('*').order('date');assertNoError(error);return(data??[]).map(activityFromRow)}
export async function createActivity(value:Activity){const{data,error}=await requireSupabase().from('activities').insert(activityToRow(value)).select().single();assertNoError(error);return activityFromRow(data as Record<string,unknown>)}
export async function updateActivity(id:string,value:Activity){const{data,error}=await requireSupabase().from('activities').update(activityToRow(value)).eq('id',id).select().single();assertNoError(error);return activityFromRow(data as Record<string,unknown>)}
export async function deleteActivity(id:string){const{error}=await requireSupabase().from('activities').delete().eq('id',id);assertNoError(error)}
