#!/usr/bin/env node
/**
 * Parse Research club pack markdown (CLUB:/WEBSITE:/VIBE:/MEMBERS:) into JSON packs.
 * school forced to "Cornell".
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";

const CATEGORY_HINTS = [
  [/kappa theta|\bktp\b|frat|sororit/i, "tech"],
  [/\bwicc\b|women in computing/i, "tech"],
  [/\bcuauv\b|auv|robo|project team/i, "tech"],
  [/appdev|hack|coding|\bcs\b/i, "tech"],
  [/\bconsult/i, "consulting"],
  [/finance|invest|trading/i, "finance"],
  [/design|product/i, "design"],
];

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function guessCategory(name, vibe = {}) {
  const blob = `${name} ${vibe.headline || ""} ${vibe.culture || ""}`;
  for (const [re, cat] of CATEGORY_HINTS) {
    if (re.test(blob)) return cat;
  }
  return "tech";
}

export function parsePackMarkdown(text, { school = "Cornell" } = {}) {
  if (!text.includes("CLUB:")) return [];
  const parts = text.split(/\n(?=CLUB: )/);
  const out = [];
  for (const p of parts) {
    if (!p.startsWith("CLUB:")) continue;
    const name = p.match(/^CLUB: (.+)/m)?.[1]?.trim();
    if (!name) continue;
    const website = p.match(/^WEBSITE: (.+)/m)?.[1]?.trim() || null;
    const roster = p.match(/^ROSTER_SOURCE: (.+)/m)?.[1]?.trim() || null;
    const vibeMatch = p.match(/VIBE: (\{[\s\S]*?\})\nMEMBERS:/);
    const memMatch = p.match(/MEMBERS: (\[[\s\S]*\])\s*$/);
    let vibeRaw = {};
    let members = [];
    try {
      vibeRaw = vibeMatch ? JSON.parse(vibeMatch[1]) : {};
    } catch (e) {
      throw new Error(`VIBE JSON parse failed for ${name}: ${e.message}`);
    }
    try {
      members = memMatch ? JSON.parse(memMatch[1]) : [];
    } catch (e) {
      throw new Error(`MEMBERS JSON parse failed for ${name}: ${e.message}`);
    }
    const x_sentiment = vibeRaw.x_sentiment ?? { summary: "", posts: [] };
    const reddit_sentiment = vibeRaw.reddit_sentiment ?? { summary: "", vibe: "mixed" };
    const vibe = {};
    for (const k of [
      "headline",
      "culture",
      "selectivity",
      "intensity",
      "social_energy",
      "values",
      "source_note",
      "recruitment",
    ]) {
      if (k in vibeRaw) vibe[k] = vibeRaw[k];
    }
    // Top-level INTERVIEW: {...} after MEMBERS (preferred for club_intel.interview).
    // Fallback: derive from vibe.recruitment so tips aren't dropped on sync.
    let interview = {};
    const interviewMatch = p.match(/\nINTERVIEW: (\{[\s\S]*\})\s*$/);
    if (interviewMatch) {
      try {
        interview = JSON.parse(interviewMatch[1]);
      } catch (e) {
        throw new Error(`INTERVIEW JSON parse failed for ${name}: ${e.message}`);
      }
    } else if (vibeRaw.recruitment) {
      const rec = vibeRaw.recruitment;
      interview = {
        process: rec.process || [],
        tips: rec.interview_tips || [],
        sources: rec.sources || [],
      };
      for (const k of ["roles", "tracks_roles", "eligibility", "class_size", "example_projects_spr26"]) {
        if (k in rec) interview[k] = rec[k];
      }
    }
    const category = guessCategory(name, vibe);
    const recruitSources = (interview.sources || []).map((url) => ({
      label: "Recruitment",
      url,
    }));
    out.push({
      school,
      name,
      slug: slugify(name),
      category,
      website,
      tagline: vibe.headline || `${name} at ${school}`,
      review: vibe.culture || vibe.headline || `${name} at ${school}`,
      vibe,
      x_sentiment,
      reddit_sentiment,
      interview,
      sources: [
        ...(website ? [{ label: "Club website", url: website }] : []),
        ...(roster ? [{ label: "Roster", url: roster }] : []),
        ...recruitSources,
      ],
      members,
      roster_source: roster,
    });
  }
  return out;
}

export function loadPacksFromDir(dir, { school = "Cornell" } = {}) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => extname(f).toLowerCase() === ".md")
    .filter((f) => !/^readme/i.test(f) && f !== "ALL_PACKS.md")
    // skip QA/report/summary wrappers that may embed empty CLUB stubs
    .filter((f) => !/(report|summary|inventory|phase-a)/i.test(f))
    .sort();
  const bySlug = new Map();
  for (const f of files) {
    const text = readFileSync(join(dir, f), "utf8");
    for (const pack of parsePackMarkdown(text, { school })) {
      const prev = bySlug.get(pack.slug);
      // Prefer the pack with more members (real roster over empty stubs)
      if (!prev || (pack.members?.length || 0) > (prev.members?.length || 0)) {
        bySlug.set(pack.slug, pack);
      }
    }
  }
  const packs = [...bySlug.values()];
  const seen = new Set(packs.map((p) => p.slug));
  // Also accept ALL_PACKS.md if individual files missing
  if (!packs.length && existsSync(join(dir, "ALL_PACKS.md"))) {
    for (const pack of parsePackMarkdown(
      readFileSync(join(dir, "ALL_PACKS.md"), "utf8"),
      { school }
    )) {
      packs.push(pack);
    }
  }
  // JSON packs dropped by Research (skip inventory stubs)
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    if (f === "cornell-packs.json") continue;
    if (/inventory|phase-a|reconcile/i.test(f)) continue;
    const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const arr = Array.isArray(data) ? data : [data];
    for (const pack of arr) {
      if (!pack?.name) continue;
      // Require a real pack shape — not {name, website_or_null, category, source}
      const isPack =
        Array.isArray(pack.members) ||
        (pack.vibe && typeof pack.vibe === "object") ||
        pack.review ||
        pack.tagline;
      if (!isPack) continue;
      const slug = pack.slug || slugify(pack.name);
      if (seen.has(slug)) continue;
      seen.add(slug);
      packs.push({
        school: pack.school || school,
        name: pack.name,
        slug,
        category: pack.category || guessCategory(pack.name, pack.vibe || {}),
        website: pack.website ?? pack.website_or_null ?? null,
        tagline: pack.tagline || pack.vibe?.headline || `${pack.name} at ${school}`,
        review: pack.review || pack.vibe?.culture || pack.vibe?.headline || `${pack.name} at ${school}`,
        vibe: pack.vibe || {},
        x_sentiment: pack.x_sentiment || {},
        reddit_sentiment: pack.reddit_sentiment || {},
        sources: pack.sources || [],
        members: pack.members || [],
      });
    }
  }
  return packs;
}

// CLI: node parse-packs.mjs <dir> [out.json]
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("parse-packs.mjs")) {
  const dir = process.argv[2];
  const out = process.argv[3];
  if (!dir) {
    console.error("Usage: node parse-packs.mjs <dir> [out.json]");
    process.exit(2);
  }
  const packs = loadPacksFromDir(dir);
  const json = JSON.stringify(packs, null, 2);
  if (out) writeFileSync(out, json);
  else console.log(json);
  console.error(`Parsed ${packs.length} packs from ${dir}`);
}
