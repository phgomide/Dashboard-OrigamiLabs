alter table public.leads add column if not exists owner_name text;
alter table public.leads add column if not exists google_maps_url text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists whatsapp text;
alter table public.leads add column if not exists instagram text;
alter table public.leads add column if not exists website text;
alter table public.leads add column if not exists commercial_note text;
alter table public.leads add column if not exists import_score integer check (import_score is null or import_score between 1 and 5);
alter table public.leads add column if not exists import_origin text default 'crm_manual';

create index if not exists leads_owner_google_maps_idx on public.leads(owner_id, google_maps_url) where google_maps_url is not null;
create index if not exists leads_owner_phone_idx on public.leads(owner_id, phone) where phone is not null;
create index if not exists leads_owner_whatsapp_idx on public.leads(owner_id, whatsapp) where whatsapp is not null;
create index if not exists leads_owner_business_city_idx on public.leads(owner_id, lower(business_name), lower(city));

grant select, insert, update, delete on public.leads to authenticated;
