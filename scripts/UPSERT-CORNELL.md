# Cornell upsert (Ship) — fresh Supabase standby

## Go-live (when Sonja pastes URL + anon, ideally service_role)
1. Confirm schema applied: run `schema.sql` in Supabase SQL Editor (or verify with script’s schema check).
2. Put keys in env (never commit):
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=...
   export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   export SUPABASE_SERVICE_ROLE_KEY=...   # preferred for seeding
   ```
3. Load first batch (4 approved):
   ```bash
   node upsert-cornell.mjs --batch first
   ```
4. As Research lands packs under `../expanded/`:
   ```bash
   node upsert-cornell.mjs --batch expanded
   # or
   node upsert-cornell.mjs --batch all
   ```
5. My Web check: onboard profile with **school = `Cornell`** exactly → clubs + members graph.

## Layout
| Path | Role |
| --- | --- |
| `schema.sql` | Fresh project DDL + demo RLS (mirror of laptop) |
| `parse-packs.mjs` | Research .md/.json → pack objects |
| `upsert-cornell.mjs` | Schema check + upsert clubs/intel/members |
| `seed-cornell.sql` | SQL Editor alt for first batch |
| `../first-batch/` | KTP / WICC / CUAUV / AppDev |
| `../expanded/` | Full Cornell set as Research lands packs |

## Rules
- school = `Cornell` exactly
- No Next hardcoding of club lists (DB-driven)
- Only Bugfix PASS names
- Prefer service_role for seed; schema allows anon insert for demo seeding
- Scrape spirit (plan.md): packs are the offline seed; live `/api/scrape` remains the on-demand school+club pipeline — do not replace it with hardcoded lists

## Dry run
```bash
node upsert-cornell.mjs --batch first --dry-run
node upsert-cornell.mjs --batch expanded --dry-run
```
