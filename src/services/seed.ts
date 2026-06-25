import { initialActivities, initialLeads, initialProjects, initialProposals } from '../data/mockData'
import { activityToRow, leadFromRow, leadToRow, projectToRow, proposalToRow } from './mappers'
import { assertNoError, requireSupabase } from './repository'

export async function seedDemoWorkspace() {
  const client=requireSupabase()
  const {data:existing,error:existingError}=await client.from('leads').select('id').limit(1)
  assertNoError(existingError)
  if(existing?.length) throw new Error('O workspace já possui leads. O seed não foi aplicado para evitar duplicação.')
  const {data:leadRows,error:leadError}=await client.from('leads').insert(initialLeads.map(leadToRow)).select()
  assertNoError(leadError)
  const saved=(leadRows??[]).map(leadFromRow)
  const idMap=new Map(initialLeads.map((lead,index)=>[lead.id,saved[index]?.id]))
  const activities=initialActivities.map((item)=>({...item,leadId:idMap.get(item.leadId)??''})).filter((item)=>item.leadId).map(activityToRow)
  const proposals=initialProposals.map((item)=>({...item,leadId:idMap.get(item.leadId)??''})).filter((item)=>item.leadId).map(proposalToRow)
  const projects=initialProjects.map((item)=>({...item,leadId:idMap.get(item.leadId)??''})).filter((item)=>item.leadId).map(projectToRow)
  const [activityResult,proposalResult,projectResult]=await Promise.all([client.from('activities').insert(activities),client.from('proposals').insert(proposals),projects.length?client.from('projects').insert(projects):Promise.resolve({error:null})])
  assertNoError(activityResult.error);assertNoError(proposalResult.error);assertNoError(projectResult.error)
  const options=[['project_type','Origami Sites'],['project_type','Origami Agenda'],['project_type','Origami Organize'],['source','Instagram'],['source','Indicação'],['source','Google'],['niche','Petshop'],['niche','Psicologia'],['niche','Barbearia']].map(([category,label],index)=>({category,label,value:label.toLowerCase().replaceAll(' ','_'),order_index:index,is_active:true}))
  const {error:optionError}=await client.from('settings_options').insert(options);assertNoError(optionError)
  return {leads:saved.length,activities:activities.length,proposals:proposals.length,projects:projects.length}
}
