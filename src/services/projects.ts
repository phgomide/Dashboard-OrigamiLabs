import type { Project } from '../types'
import { projectFromRow, projectToRow } from './mappers'
import { assertNoError, requireSupabase } from './repository'
export async function listProjects(){const{data,error}=await requireSupabase().from('projects').select('*').order('created_at',{ascending:false});assertNoError(error);return(data??[]).map(projectFromRow)}
export async function createProject(value:Project){const{data,error}=await requireSupabase().from('projects').insert(projectToRow(value)).select().single();assertNoError(error);return projectFromRow(data as Record<string,unknown>)}
export async function updateProject(id:string,value:Project){const{data,error}=await requireSupabase().from('projects').update(projectToRow(value)).eq('id',id).select().single();assertNoError(error);return projectFromRow(data as Record<string,unknown>)}
export async function deleteProject(id:string){const{error}=await requireSupabase().from('projects').delete().eq('id',id);assertNoError(error)}
