/**
 * Seed UC Berkeley demo clubs + Berkeley Consulting roster into Supabase.
 * Old prod DB is gone — this recreates the Campus Cup Berkeley consulting demo.
 *
 * Usage:
 *   export NEXT_PUBLIC_SUPABASE_URL=...
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   node scripts/seed-berkeley-demo.mjs
 *   node scripts/seed-berkeley-demo.mjs --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const SCHOOL = "UC Berkeley";

const CLUBS = [
  {
    slug: "berkeley-consulting",
    name: "Berkeley Consulting",
    category: "consulting",
    website: "https://berkeleyconsulting.org",
    tagline: "Premier undergraduate consulting club at UC Berkeley",
    review:
      "Case-heavy Berkeley consulting org with client engagements, strong MBB/T2 pipeline, and a dense alumni network.",
    clients: ["Google", "Kaiser Permanente", "Salesforce", "Levi Strauss", "BART"],
    vibe: {
      headline: "Competitive, polished, client-facing",
      culture: "High commitment during engagements; strong case culture.",
      selectivity: "Selective resume + case interviews",
      intensity: "High during active projects",
      social_energy: "Retreats + recruiting formals",
      values: ["structured thinking", "client impact", "recruiting"],
    },
  },
  {
    slug: "voyager-consulting",
    name: "Voyager Consulting",
    category: "consulting",
    website: null,
    tagline: "Berkeley undergraduate strategy consulting",
    review: "Strategy consulting club often compared with Berkeley Consulting in recruiting chats.",
    clients: [],
    vibe: {
      headline: "Strategy-focused consulting alternative",
      culture: "Case prep and client work with a slightly different culture than BC.",
      selectivity: "Competitive",
      intensity: "Medium-high",
      social_energy: "Active recruiting season",
      values: ["strategy", "cases"],
    },
  },
  {
    slug: "edge-consulting",
    name: "EDGE Consulting",
    category: "consulting",
    website: null,
    tagline: "Berkeley undergraduate consulting",
    review: "Another Berkeley consulting path — useful contrast club for the demo toggle.",
    clients: [],
    vibe: {
      headline: "Consulting with a builder bent",
      culture: "Project work + recruiting prep.",
      selectivity: "Competitive",
      intensity: "Medium",
      social_energy: "Moderate",
      values: ["consulting", "projects"],
    },
  },
  {
    slug: "berkeley-investment-group",
    name: "Berkeley Investment Group",
    category: "finance",
    website: null,
    tagline: "Student investment community at Berkeley",
    review: "Finance-leaning org so Berkeley toggle isn’t consulting-only.",
    clients: [],
    vibe: {
      headline: "Markets and investing",
      culture: "Pitch meetings and investing education.",
      selectivity: "Varies",
      intensity: "Medium",
      social_energy: "Moderate",
      values: ["investing", "markets"],
    },
  },
  {
    slug: "codebase",
    name: "Codebase",
    category: "tech",
    website: null,
    tagline: "Berkeley software consulting for nonprofits and startups",
    review: "Tech consulting / build club — good Big Tech adjacent match on Berkeley.",
    clients: [],
    vibe: {
      headline: "Build for real clients",
      culture: "Engineering project teams.",
      selectivity: "Competitive for builders",
      intensity: "High during sprints",
      social_energy: "Team-oriented",
      values: ["software", "impact"],
    },
  },
];

/** Parse members from seed-berkeley-consulting-roster.sql values rows. */
function parseRosterSql(sqlPath) {
  const text = readFileSync(sqlPath, "utf8");
  const members = [];
  // ('Name','Role','url','@ig','email',array['a','b'],'relevance...',false),
  const rowRe =
    /\('((?:\\'|[^'])*)','((?:\\'|[^'])*)','((?:\\'|[^'])*)','((?:\\'|[^'])*)','((?:\\'|[^'])*)',array\[([^\]]*)\],'((?:\\'|[^'])*)',(true|false)\)/g;
  let m;
  while ((m = rowRe.exec(text))) {
    const tags = m[6]
      .split(",")
      .map((t) => t.trim().replace(/^'|'$/g, ""))
      .filter(Boolean);
    members.push({
      name: m[1].replace(/''/g, "'"),
      role: m[2].replace(/''/g, "'"),
      linkedin_url: m[3],
      instagram: m[4],
      email: m[5],
      career_tags: tags,
      relevance: m[7].replace(/''/g, "'"),
      is_alumni: m[8] === "true",
    });
  }
  return members;
}

async function main() {
  const rosterPath = join(__dirname, "seed-berkeley-consulting-roster.sql");
  const roster = parseRosterSql(rosterPath);
  console.log(`clubs=${CLUBS.length} roster_members=${roster.length} dryRun=${dryRun}`);

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          school: SCHOOL,
          clubs: CLUBS.map((c) => c.slug),
          sampleMembers: roster.slice(0, 3),
        },
        null,
        2
      )
    );
    return;
  }

  for (const club of CLUBS) {
    const { data: upserted, error } = await sb
      .from("clubs")
      .upsert(
        {
          school: SCHOOL,
          name: club.name,
          slug: club.slug,
          category: club.category,
          website: club.website,
          tagline: club.tagline,
        },
        { onConflict: "school,slug" }
      )
      .select("id,slug")
      .single();
    if (error) throw new Error(`club ${club.slug}: ${error.message}`);
    console.log("club", upserted.slug, upserted.id);

    const { error: intelErr } = await sb.from("club_intel").upsert(
      {
        club_id: upserted.id,
        review: club.review,
        clients: club.clients,
        retreats: [],
        interview: {},
        reddit_sentiment: {},
        vibe: club.vibe,
        x_sentiment: {},
        sources: [],
        placements: [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "club_id" }
    );
    if (intelErr) throw new Error(`intel ${club.slug}: ${intelErr.message}`);

    if (club.slug === "berkeley-consulting" && roster.length) {
      let inserted = 0;
      for (const mem of roster) {
        const { error: memErr } = await sb.from("members").upsert(
          {
            club_id: upserted.id,
            name: mem.name,
            role: mem.role,
            linkedin_url: mem.linkedin_url,
            instagram: mem.instagram,
            email: mem.email,
            career_tags: mem.career_tags,
            relevance: mem.relevance,
            is_alumni: mem.is_alumni,
          },
          { onConflict: "club_id,name" }
        );
        if (memErr) {
          console.warn("member skip", mem.name, memErr.message);
          continue;
        }
        inserted += 1;
      }
      console.log(`roster upserted ${inserted}/${roster.length}`);
    }
  }

  const { data: counts } = await sb.from("clubs").select("school");
  const by = {};
  for (const r of counts ?? []) by[r.school] = (by[r.school] ?? 0) + 1;
  console.log("DONE school counts", by);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
