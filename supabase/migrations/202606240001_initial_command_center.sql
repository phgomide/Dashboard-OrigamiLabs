create extension if not exists pgcrypto;

create type public.pipeline_status as enum ('Novo lead','Primeiro contato','Conversando','Reunião marcada','Diagnóstico feito','Proposta enviada','Negociação','Fechado','Perdido','Futuro');
create type public.lead_temperature as enum ('Quente','Morno','Frio');
create type public.priority_level as enum ('Alta','Média','Baixa');
create type public.payment_status as enum ('Não se aplica','Pendente','Parcial','Pago');
create type public.activity_status as enum ('Pendente','Concluída','Atrasada','Cancelada');
create type public.proposal_status as enum ('Rascunho','Enviada','Em negociação','Aceita','Recusada','Expirada');
create type public.project_status as enum ('Aguardando início','Em desenvolvimento','Revisão','Ajustes finais','Entregue','Pausado','Cancelado');
create type public.project_stage as enum ('Briefing','Estrutura','Design','Desenvolvimento','Revisão','Publicação','Entrega final');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Origami Labs' check (char_length(name) between 1 and 120),
  role text not null default 'owner' check (role in ('owner','member')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 1 and 160),
  contact_name text check (contact_name is null or char_length(contact_name) <= 160),
  niche text not null check (char_length(niche) between 1 and 120),
  source text not null check (char_length(source) between 1 and 120),
  city text not null default '',
  public_link text,
  project_interest text not null,
  pipeline_status public.pipeline_status not null default 'Novo lead',
  lead_temperature public.lead_temperature not null default 'Morno',
  priority public.priority_level not null default 'Média',
  estimated_value numeric(12,2) not null default 0 check (estimated_value >= 0),
  final_value numeric(12,2) check (final_value is null or final_value >= 0),
  payment_status public.payment_status not null default 'Não se aplica',
  next_action_date date,
  next_action text,
  notes text check (notes is null or char_length(notes) <= 5000),
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  type text not null,
  description text check (description is null or char_length(description) <= 3000),
  date date not null,
  time time,
  status public.activity_status not null default 'Pendente',
  priority public.priority_level not null default 'Média',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null check (char_length(type) between 1 and 80),
  description text not null check (char_length(description) between 1 and 3000),
  created_at timestamptz not null default now()
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  project_type text not null,
  plan_name text not null,
  value numeric(12,2) not null check (value >= 0),
  status public.proposal_status not null default 'Rascunho',
  sent_at date,
  valid_until date,
  probability integer not null default 0 check (probability between 0 and 100),
  notes text check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete restrict,
  project_type text not null,
  value numeric(12,2) not null check (value >= 0),
  status public.project_status not null default 'Aguardando início',
  current_stage public.project_stage not null default 'Briefing',
  payment_status public.payment_status not null default 'Pendente',
  started_at date,
  deadline date,
  delivered_at date,
  notes text check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings_options (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check (char_length(category) between 1 and 80),
  label text not null check (char_length(label) between 1 and 120),
  value text not null check (char_length(value) between 1 and 120),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, category, value)
);

create index leads_owner_status_idx on public.leads(owner_id, pipeline_status);
create index leads_owner_next_action_idx on public.leads(owner_id, next_action_date);
create index activities_owner_date_idx on public.activities(owner_id, date);
create index proposals_owner_status_idx on public.proposals(owner_id, status);
create index projects_owner_status_idx on public.projects(owner_id, status);

create function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger activities_updated_at before update on public.activities for each row execute function public.set_updated_at();
create trigger proposals_updated_at before update on public.proposals for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger settings_updated_at before update on public.settings_options for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id, name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Origami Labs'));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.interactions enable row level security;
alter table public.proposals enable row level security;
alter table public.projects enable row level security;
alter table public.settings_options enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

do $$ declare table_name text; begin
  foreach table_name in array array['leads','activities','interactions','proposals','projects','settings_options'] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', table_name || '_delete_own', table_name);
  end loop;
end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.leads, public.activities, public.interactions, public.proposals, public.projects, public.settings_options to authenticated;
grant select, update on public.profiles to authenticated;
revoke all on public.leads, public.activities, public.interactions, public.proposals, public.projects, public.settings_options, public.profiles from anon;
