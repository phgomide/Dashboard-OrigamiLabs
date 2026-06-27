create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.leads_origami (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome_negocio text not null check (char_length(nome_negocio) between 1 and 180),
  nome_dono text,
  cidade text not null check (char_length(cidade) between 1 and 120),
  google_maps_url text,
  telefone text,
  whatsapp text,
  instagram text,
  site text,
  nicho text not null check (char_length(nicho) between 1 and 120),
  oportunidade text not null check (char_length(oportunidade) between 1 and 180),
  score integer not null check (score >= 1 and score <= 5),
  observacao_comercial text,
  status text not null default 'novo' check (
    status in (
      'novo',
      'contatado',
      'respondeu',
      'interessado',
      'proposta_enviada',
      'fechado',
      'perdido',
      'sem_resposta'
    )
  ),
  origem text default 'pesquisa_manual_json',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists leads_origami_owner_status_idx on public.leads_origami(owner_id, status);
create index if not exists leads_origami_owner_nicho_idx on public.leads_origami(owner_id, nicho);
create index if not exists leads_origami_owner_oportunidade_idx on public.leads_origami(owner_id, oportunidade);
create index if not exists leads_origami_owner_score_idx on public.leads_origami(owner_id, score);
create unique index if not exists leads_origami_owner_google_maps_idx on public.leads_origami(owner_id, google_maps_url) where google_maps_url is not null;
create index if not exists leads_origami_owner_nome_cidade_idx on public.leads_origami(owner_id, lower(nome_negocio), lower(cidade));

drop trigger if exists leads_origami_updated_at on public.leads_origami;
create trigger leads_origami_updated_at before update on public.leads_origami for each row execute function public.set_updated_at();

alter table public.leads_origami enable row level security;

drop policy if exists leads_origami_select_own on public.leads_origami;
drop policy if exists leads_origami_insert_own on public.leads_origami;
drop policy if exists leads_origami_update_own on public.leads_origami;
drop policy if exists leads_origami_delete_own on public.leads_origami;

create policy leads_origami_select_own on public.leads_origami
  for select to authenticated using ((select auth.uid()) = owner_id);

create policy leads_origami_insert_own on public.leads_origami
  for insert to authenticated with check ((select auth.uid()) = owner_id);

create policy leads_origami_update_own on public.leads_origami
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy leads_origami_delete_own on public.leads_origami
  for delete to authenticated using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.leads_origami to authenticated;
revoke all on public.leads_origami from anon;
