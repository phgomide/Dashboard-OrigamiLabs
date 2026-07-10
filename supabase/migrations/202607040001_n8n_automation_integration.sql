-- Align Dashboard Leads schema with the Origami n8n lead-capture workflow.
-- Safe/idempotent. Adds automation fields used by PostgREST upsert on automation_dedupe_key.

alter table public.leads add column if not exists automation_dedupe_key text;
alter table public.leads add column if not exists automation_raw jsonb;
alter table public.leads add column if not exists outreach_status text default 'rascunho_gerado';
alter table public.leads add column if not exists outreach_variant text;
alter table public.leads add column if not exists selected_message_variant text;
alter table public.leads add column if not exists response_status text default 'nao_abordado';
alter table public.leads add column if not exists conversion_status text default 'nao_iniciado';
alter table public.leads add column if not exists followup_count integer default 0;
alter table public.leads add column if not exists first_touch_at timestamptz;
alter table public.leads add column if not exists last_followup_at timestamptz;
alter table public.leads add column if not exists next_followup_date date;
alter table public.leads add column if not exists conversion_notes text;

alter table public.leads drop constraint if exists leads_outreach_status_check;
alter table public.leads add constraint leads_outreach_status_check
  check (outreach_status in (
    'rascunho_gerado',
    'abordado_manual',
    'followup_1_sugerido',
    'followup_1_enviado_manual',
    'followup_2_sugerido',
    'followup_2_enviado_manual',
    'pausado',
    'nao_contatar'
  ));

alter table public.leads drop constraint if exists leads_response_status_check;
alter table public.leads add constraint leads_response_status_check
  check (response_status in (
    'nao_abordado',
    'sem_resposta',
    'respondeu',
    'pediu_informacoes',
    'reuniao_marcada',
    'resposta_negativa',
    'nao_contatar'
  ));

alter table public.leads drop constraint if exists leads_conversion_status_check;
alter table public.leads add constraint leads_conversion_status_check
  check (conversion_status in (
    'nao_iniciado',
    'em_conversa',
    'reuniao_marcada',
    'proposta_enviada',
    'convertido',
    'perdido'
  ));

drop index if exists public.leads_automation_dedupe_key_uidx;
create unique index if not exists leads_automation_dedupe_key_uidx
  on public.leads(automation_dedupe_key);

create or replace function public.cleanup_automation_lead_duplicates()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  with scoped as (
    select
      id,
      owner_id,
      automation_dedupe_key,
      created_at,
      updated_at,
      (
        case when coalesce(nullif(google_maps_url, ''), null) is not null then 1 else 0 end +
        case when coalesce(nullif(phone, ''), null) is not null then 1 else 0 end +
        case when coalesce(nullif(whatsapp, ''), null) is not null then 1 else 0 end +
        case when coalesce(nullif(instagram, ''), null) is not null then 1 else 0 end +
        case when coalesce(nullif(website, ''), null) is not null then 1 else 0 end +
        case when coalesce(nullif(personalized_message, ''), null) is not null then 1 else 0 end
      ) as richness_score
    from public.leads
    where automation_dedupe_key is not null
      and automation_dedupe_key <> ''
      and import_origin = 'automacao_apify_n8n'
      and pipeline_status = 'Novo lead'
      and coalesce(outreach_status, 'rascunho_gerado') in ('rascunho_gerado', 'pausado')
      and coalesce(response_status, 'nao_abordado') = 'nao_abordado'
      and first_touch_at is null
      and not exists (select 1 from public.activities a where a.lead_id = leads.id)
      and not exists (select 1 from public.interactions i where i.lead_id = leads.id)
      and not exists (select 1 from public.proposals p where p.lead_id = leads.id)
      and not exists (select 1 from public.projects pr where pr.lead_id = leads.id)
      and (current_setting('request.jwt.claim.role', true) = 'service_role' or owner_id = (select auth.uid()))
  ),
  ranked as (
    select
      id,
      row_number() over (
        partition by owner_id, lower(trim(automation_dedupe_key))
        order by richness_score desc, created_at asc, updated_at desc, id asc
      ) as duplicate_rank
    from scoped
  ),
  deleted as (
    delete from public.leads l
    using ranked r
    where l.id = r.id
      and r.duplicate_rank > 1
      and (current_setting('request.jwt.claim.role', true) = 'service_role' or l.owner_id = (select auth.uid()))
    returning l.id
  )
  select count(*) into deleted_count from deleted;

  return deleted_count;
end;
$$;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.leads to service_role;
revoke all on function public.cleanup_automation_lead_duplicates() from public, anon;
grant execute on function public.cleanup_automation_lead_duplicates() to service_role, authenticated;

notify pgrst, 'reload schema';
