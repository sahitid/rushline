-- Alumni / placement signals scraped from club sites
alter table club_intel
  add column if not exists placements jsonb default '[]'::jsonb;
