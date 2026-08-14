#!/usr/bin/env node
/**
 * Upsert Cornell Rushline clubs + club_intel + members.
 *
 * Batches:
 *   --batch first     first-batch/ (KTP, WICC, CUAUV, AppDev) — Bugfix approved
 *   --batch expanded  expanded/ as Research lands packs
 *   --batch all       first then expanded (slug-deduped; first wins)
 *
 * Creds (do not commit):
 *   NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   Prefer SUPABASE_SERVICE_ROLE_KEY for seeding (RLS bypass)
 *
 * school = "Cornell" exactly. No Next app club-list hardcoding.
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPacksFromDir } from "./parse-packs.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
function resolveRoot() {
  if (process.env.CORNELL_PACKS_ROOT) return process.env.CORNELL_PACKS_ROOT;
  const candidates = [
    join(__dir, ".."), // box: /workspace/rushline-cornell
    join(__dir, "..", ".grok", "intel", "cornell"), // laptop: rushline/.grok/intel/cornell
    "/workspace/rushline-cornell",
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "first-batch")) || existsSync(join(c, "KTP.md")) || existsSync(join(c, "expanded"))) {
      return c;
    }
  }
  return candidates[0];
}
const ROOT = resolveRoot();
const FIRST = existsSync(join(ROOT, "first-batch")) ? join(ROOT, "first-batch") : ROOT;
const EXPANDED = join(ROOT, "expanded");

const args = new Set(process.argv.slice(2));
const batchArg = (() => {
  const i = process.argv.indexOf("--batch");
  return i >= 0 ? process.argv[i + 1] : "first";
})();

let sb;
let usingService = false;

function loadApprovedSlugSet() {
  const path = join(EXPANDED, "APPROVED.json");
  if (!existsSync(path)) {
    console.warn("No expanded/APPROVED.json — refusing to load expanded packs (Bugfix gate).");
    return new Set();
  }
  const data = JSON.parse(readFileSync(path, "utf8"));
  return new Set([...(data.approved_slugs || []), ...((data.approved_names || []).map((n) => n))]);
}

function loadExpanded() {
  // Phase B: expanded/packs/ + expanded/ root. Only Bugfix-APPROVED slugs/names.
  // Pass --include-pending to load unapproved (debug only; never for prod upsert).
  const allow = loadApprovedSlugSet();
  const includePending = args.has("--include-pending");
  const dirs = [join(EXPANDED, "packs"), EXPANDED];
  const seen = new Set();
  const out = [];
  let skipped = 0;
  for (const dir of dirs) {
    for (const pack of loadPacksFromDir(dir)) {
      if (seen.has(pack.slug)) continue;
      seen.add(pack.slug);
      const ok = allow.has(pack.slug) || allow.has(pack.name);
      if (!ok && !includePending) {
        skipped++;
        continue;
      }
      if (!ok && includePending) pack._pending = true;
      out.push(pack);
    }
  }
  if (skipped) console.error(`(filtered ${skipped} expanded packs not in APPROVED.json)`);
  return out;
}

function loadBatch(which) {
  if (which === "first") return loadPacksFromDir(FIRST);
  if (which === "expanded") return loadExpanded();
  if (which === "all") {
    const a = loadPacksFromDir(FIRST);
    const seen = new Set(a.map((p) => p.slug));
    const b = loadExpanded().filter((p) => !seen.has(p.slug));
    return [...a, ...b];
  }
  throw new Error(`Unknown --batch ${which} (use first|expanded|all)`);
}

function memberRow(clubId, m) {
  const talking = Array.isArray(m.talking_points)
    ? m.talking_points
    : m.talking_points
      ? [String(m.talking_points)]
      : [];
  return {
    club_id: clubId,
    name: m.name,
    role: m.role ?? null,
    linkedin_url: m.linkedin_url ?? null,
    instagram: m.instagram ?? null,
    email: m.email ?? null,
    career_tags: Array.isArray(m.career_tags) ? m.career_tags : [],
    relevance: m.relevance ?? null,
    is_alumni: Boolean(m.is_alumni),
    talking_points: talking,
    best_ask: m.best_ask ?? null,
  };
}

async function confirmSchema() {
  const checks = [
    sb.from("clubs").select("id").limit(1),
    sb.from("club_intel").select("club_id").limit(1),
    sb.from("members").select("id").limit(1),
  ];
  const results = await Promise.all(checks);
  for (const r of results) {
    if (r.error) {
      throw new Error(
        `Schema check failed: ${r.error.message}. Run scripts/schema.sql in SQL Editor first.`
      );
    }
  }
  // talking_points column present?
  const { error } = await sb.from("members").select("talking_points,best_ask").limit(1);
  if (error) {
    throw new Error(
      `Schema missing members.talking_points/best_ask: ${error.message}. Re-run latest schema.sql.`
    );
  }
  console.log("✓ schema present (clubs, club_intel, members + talking_points/best_ask)");
}

async function upsertClub(pack) {
  if (pack.school !== "Cornell") {
    throw new Error(`Refuse non-Cornell school: ${pack.school} (${pack.name})`);
  }
  const { data: club, error } = await sb
    .from("clubs")
    .upsert(
      {
        school: "Cornell",
        name: pack.name,
        slug: pack.slug,
        category: pack.category,
        website: pack.website,
        tagline: pack.tagline,
      },
      { onConflict: "school,slug" }
    )
    .select()
    .single();
  if (error) throw new Error(`clubs upsert ${pack.slug}: ${error.message}`);
  return club;
}

async function upsertIntel(clubId, pack) {
  const { error } = await sb.from("club_intel").upsert(
    {
      club_id: clubId,
      review: pack.review,
      clients: pack.clients ?? [],
      retreats: pack.retreats ?? [],
      interview: pack.interview ?? {},
      reddit_sentiment: pack.reddit_sentiment ?? {},
      vibe: pack.vibe ?? {},
      x_sentiment: pack.x_sentiment ?? {},
      sources: pack.sources ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "club_id" }
  );
  if (error) throw new Error(`club_intel upsert ${clubId}: ${error.message}`);
}

async function upsertMembers(clubId, members) {
  if (!members?.length) return 0;
  const rows = members.filter((m) => m?.name).map((m) => memberRow(clubId, m));
  const { error } = await sb.from("members").upsert(rows, {
    onConflict: "club_id,name",
  });
  if (error) throw new Error(`members upsert ${clubId}: ${error.message}`);
  return rows.length;
}

async function main() {
  const packs = loadBatch(batchArg);
  if (args.has("--dry-run")) {
    console.log(JSON.stringify(packs.map((p) => ({ name: p.name, slug: p.slug, category: p.category, members: p.members.length, school: p.school })), null, 2));
    console.log(`dry-run: ${packs.length} packs (--batch ${batchArg})`);
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  usingService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) {
    console.error(
      "Missing Supabase creds. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (prefer SUPABASE_SERVICE_ROLE_KEY)."
    );
    process.exit(2);
  }
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(url, key, { auth: { persistSession: false } });

  console.log(`Auth: ${usingService ? "service_role" : "anon"} | batch=${batchArg}`);
  await confirmSchema();
  if (!packs.length) {
    console.error(`No packs found for batch=${batchArg}. Drop .md/.json under ${batchArg === "expanded" ? EXPANDED : FIRST}`);
    process.exit(1);
  }

  // snapshot for audit
  const snapDir = join(ROOT, "scripts", ".last-run");
  mkdirSync(snapDir, { recursive: true });
  writeFileSync(join(snapDir, `${batchArg}.json`), JSON.stringify(packs, null, 2));

  const summary = [];
  for (const pack of packs) {
    const club = await upsertClub(pack);
    await upsertIntel(club.id, pack);
    const n = await upsertMembers(club.id, pack.members);
    summary.push({ name: club.name, slug: club.slug, id: club.id, members: n });
    console.log(`✓ ${club.name} (${club.slug}) members=${n}`);
  }

  console.log('\nDONE. My Web: onboard a profile with school = "Cornell" exactly.');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
