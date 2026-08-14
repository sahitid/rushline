-- LinkedIn Experiences enrich (Ship / Lead 2026-08-10)
alter table members add column if not exists linkedin_status text;
alter table members add column if not exists linkedin_experiences jsonb default '[]'::jsonb;
alter table members add column if not exists linkedin_scraped_at timestamptz;
alter table club_intel add column if not exists placements jsonb default '[]'::jsonb;
