-- Ranking personalization: LinkedIn profile fields + user_connections
-- Apply in Supabase SQL Editor on project jmuhrmtmcichyssaqigx

alter table profiles
  add column if not exists linkedin_scraped_at timestamptz,
  add column if not exists linkedin_headline text,
  add column if not exists linkedin_school text,
  add column if not exists linkedin_high_school text,
  add column if not exists linkedin_profile jsonb default '{}'::jsonb,
  add column if not exists linkedin_experiences jsonb default '[]'::jsonb,
  add column if not exists linkedin_connection_count int;

create table if not exists user_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  connected_linkedin_slug text not null,
  connected_linkedin_url text,
  connected_name text,
  degree int not null default 1 check (degree in (1, 2)),
  created_at timestamptz default now(),
  unique (user_id, connected_linkedin_slug)
);

create index if not exists user_connections_user_id_idx on user_connections (user_id);
create index if not exists user_connections_slug_idx on user_connections (connected_linkedin_slug);

alter table user_connections enable row level security;

drop policy if exists "connections read own" on user_connections;
create policy "connections read own" on user_connections
  for select using (auth.uid() = user_id);

drop policy if exists "connections insert own" on user_connections;
create policy "connections insert own" on user_connections
  for insert with check (auth.uid() = user_id);

drop policy if exists "connections update own" on user_connections;
create policy "connections update own" on user_connections
  for update using (auth.uid() = user_id);

drop policy if exists "connections delete own" on user_connections;
create policy "connections delete own" on user_connections
  for delete using (auth.uid() = user_id);

-- Service-role / seed path for import API using service key
drop policy if exists "connections service insert" on user_connections;
