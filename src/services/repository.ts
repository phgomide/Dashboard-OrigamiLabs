import { supabase } from '../lib/supabase'

export function requireSupabase() { if(!supabase) throw new Error('Supabase não configurado.'); return supabase }
export function assertNoError(error:{message:string}|null) { if(error) { console.error('Supabase operation failed'); throw new Error('Não foi possível salvar os dados. Tente novamente.') } }
