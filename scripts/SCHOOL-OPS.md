# School ops (seed / refresh clubs)

Use this to load or update club intel for a school (Cornell today; same pattern for Penn, etc.).

## 1. Schema
Run in Supabase SQL Editor (fresh project) or verify existing:
- `scripts/schema.sql`
- Then ranking/placements migrations if missing:
  - `scripts/migrate-ranking.sql`
  - `scripts/migrate-placements.sql`
  - `scripts/migrations/*.sql`

## 2. Packs
Research / Grok drops markdown packs under:
`.grok/intel/<school>/first-batch/` and `expanded/`

Person/vibe research: `.grok/skills/stalk` (`/stalk person|vibe`).

## 3. Upsert (Cornell)
```bash
export NEXT_PUBLIC_SUPABASE_URL=...
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...   # preferred

node scripts/upsert-cornell.mjs --batch first --dry-run
node scripts/upsert-cornell.mjs --batch expanded
```
See `UPSERT-CORNELL.md`. For a new school: copy packs under `.grok/intel/<school>/`, extend parse/upsert to accept `--school` (packs already carry a school field in parse-packs).

## 4. Rules
- Canonical school strings must match the app picker (`Cornell`, `UC Berkeley`, …).
- Do not hardcode club lists in Next.js — DB-driven only.
- Never commit `.env*`.
