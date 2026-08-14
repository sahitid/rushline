-- rushline schema (fresh Supabase project) — mirror of laptop scripts/schema.sql
-- Run in SQL Editor, then paste URL + anon key into .env.local

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  school text,
  career_goal text check (career_goal in ('consulting','startups','big_tech','quant','finance') or career_goal is null),
  linkedin_url text,
  linkedin_scraped_at timestamptz,
  linkedin_headline text,
  linkedin_school text,
  linkedin_high_school text,
  linkedin_profile jsonb default '{}'::jsonb,
  linkedin_experiences jsonb default '[]'::jsonb,
  linkedin_connection_count int,
  target_clubs text[] default '{}',
  created_at timestamptz default now()
);

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

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  name text not null,
  slug text not null,
  category text,
  website text,
  tagline text,
  created_at timestamptz default now(),
  unique (school, slug)
);

create table if not exists club_intel (
  club_id uuid primary key references clubs(id) on delete cascade,
  review text,
  clients text[] default '{}',
  retreats jsonb default '[]',
  interview jsonb default '{}',
  reddit_sentiment jsonb default '{}',
  vibe jsonb default '{}',
  x_sentiment jsonb default '{}',
  sources jsonb default '[]',
  placements jsonb default '[]',
  updated_at timestamptz default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null,
  role text,
  linkedin_url text,
  linkedin_status text,
  linkedin_experiences jsonb default '[]'::jsonb,
  linkedin_scraped_at timestamptz,
  instagram text,
  email text,
  career_tags text[] default '{}',
  relevance text,
  is_alumni boolean default false,
  talking_points text[] default '{}',
  best_ask text,
  unique (club_id, name)
);

create table if not exists reddit_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  title text not null,
  url text not null,
  snippet text,
  score int default 0,
  subreddit text
);

alter table profiles enable row level security;
alter table user_connections enable row level security;
alter table clubs enable row level security;
alter table club_intel enable row level security;
alter table members enable row level security;
alter table reddit_posts enable row level security;

create policy "profiles read own" on profiles for select using (auth.uid() = id);
create policy "profiles upsert own" on profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on profiles for update using (auth.uid() = id);

create policy "connections read own" on user_connections for select using (auth.uid() = user_id);
create policy "connections insert own" on user_connections for insert with check (auth.uid() = user_id);
create policy "connections update own" on user_connections for update using (auth.uid() = user_id);
create policy "connections delete own" on user_connections for delete using (auth.uid() = user_id);

create policy "clubs read all" on clubs for select using (true);
create policy "clubs insert authenticated" on clubs for insert to authenticated with check (true);
create policy "clubs update authenticated" on clubs for update to authenticated using (true);

create policy "intel read all" on club_intel for select using (true);
create policy "intel upsert authenticated" on club_intel for insert to authenticated with check (true);
create policy "intel update authenticated" on club_intel for update to authenticated using (true);

create policy "members read all" on members for select using (true);
create policy "members insert authenticated" on members for insert to authenticated with check (true);
create policy "members update authenticated" on members for update to authenticated using (true);

create policy "reddit read all" on reddit_posts for select using (true);
create policy "reddit insert authenticated" on reddit_posts for insert to authenticated with check (true);
create policy "reddit delete authenticated" on reddit_posts for delete to authenticated using (true);

create policy "clubs anon read" on clubs for select using (true);
create policy "intel anon read" on club_intel for select using (true);
create policy "members anon read" on members for select using (true);
create policy "reddit anon read" on reddit_posts for select using (true);

create policy "clubs anon insert seed" on clubs for insert to anon with check (true);
create policy "intel anon insert seed" on club_intel for insert to anon with check (true);
create policy "members anon insert seed" on members for insert to anon with check (true);

-- LinkedIn Experiences enrich (2026-08-10)
alter table members add column if not exists linkedin_status text;
alter table members add column if not exists linkedin_experiences jsonb default '[]'::jsonb;
alter table members add column if not exists linkedin_scraped_at timestamptz;
alter table club_intel add column if not exists placements jsonb default '[]'::jsonb;

