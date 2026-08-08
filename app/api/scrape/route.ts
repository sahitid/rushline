import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchReddit } from "@/lib/scrape/reddit";
import { scrapeClubSite } from "@/lib/scrape/clubsite";
import { hasLLM, llmJSON } from "@/lib/llm";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const SCHOOLS = ["uc berkeley", "berkeley", "stanford", "ucla", "usc", "mit"];

function parseQuery(query: string, fallbackSchool?: string) {
  const lower = query.toLowerCase();
  let school = fallbackSchool || "UC Berkeley";
  let clubName = query.trim();
  for (const s of SCHOOLS) {
    if (lower.startsWith(s)) {
      school = s === "berkeley" ? "UC Berkeley" : s.replace(/\b\w/g, (c) => c.toUpperCase());
      clubName = query.slice(s.length).trim();
      break;
    }
  }
  return { school, clubName: clubName || query.trim() };
}

export async function POST(req: Request) {
  const { query, school: schoolInput, clubUrl } = await req.json();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const { school, clubName } = parseQuery(query, schoolInput);

  const [redditHits, site] = await Promise.all([
    searchReddit(school, clubName),
    clubUrl ? scrapeClubSite(clubUrl) : Promise.resolve(null),
  ]);

  let intel: {
    category?: string;
    tagline?: string;
    review?: string;
    clients?: string[];
    retreats?: { place: string; note?: string }[];
    interview?: Record<string, unknown>;
    vibe?: Record<string, unknown>;
    reddit_sentiment?: Record<string, unknown>;
  } | null = null;

  if (hasLLM()) {
    intel = await llmJSON(
      `You are building a recruiting intel profile for the campus club "${clubName}" at ${school}.
Use the following live Reddit snippets as ground truth where relevant:
${redditHits.map((h) => `- ${h.title}: ${h.snippet}`).join("\n").slice(0, 2000)}
${site ? `\nClub website text:\n${site.text.slice(0, 2000)}` : ""}

Produce a JSON object with:
{
 "category": "consulting" | "finance" | "tech" | "vc" | "design" | other,
 "tagline": short one-liner,
 "review": 3-4 sentence honest rundown,
 "clients": string[] (real if known, else []),
 "retreats": [{"place": string, "note": string}],
 "interview": {"rounds": number, "technical_round": boolean, "case_format": string, "difficulty": string, "notes": string},
 "vibe": {"headline": string, "culture": string, "selectivity": string, "intensity": string, "social_energy": string, "values": string[], "source_note": "Synthesized from Reddit + public chatter"},
 "reddit_sentiment": {"summary": string, "vibe": "positive"|"mixed"|"negative"}
}`,
      "You produce accurate, useful, non-generic club intel. Prefer specifics; leave arrays empty rather than inventing fake client names."
    );
  }

  const sources = [
    ...(clubUrl ? [{ label: "Club website", url: clubUrl }] : []),
    ...redditHits.slice(0, 3).map((h) => ({ label: "Reddit", url: h.url })),
  ];

  const { data: club, error } = await sb
    .from("clubs")
    .upsert(
      {
        school,
        name: clubName,
        slug: slugify(clubName),
        category: intel?.category ?? "club",
        website: clubUrl ?? null,
        tagline: intel?.tagline ?? `${clubName} at ${school}`,
      },
      { onConflict: "school,slug" }
    )
    .select()
    .single();

  if (error || !club) {
    return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
  }

  await sb.from("club_intel").upsert({
    club_id: club.id,
    review: intel?.review ?? `${clubName} at ${school}. Live intel is limited — scraped ${redditHits.length} Reddit threads.`,
    clients: intel?.clients ?? [],
    retreats: intel?.retreats ?? [],
    interview: intel?.interview ?? {},
    reddit_sentiment: intel?.reddit_sentiment ?? {},
    vibe: intel?.vibe ?? {},
    x_sentiment: {},
    sources,
    updated_at: new Date().toISOString(),
  });

  if (redditHits.length) {
    await sb.from("reddit_posts").delete().eq("club_id", club.id);
    await sb.from("reddit_posts").insert(
      redditHits.slice(0, 8).map((h) => ({
        club_id: club.id,
        title: h.title,
        url: h.url,
        snippet: h.snippet,
        score: h.score,
        subreddit: h.subreddit,
      }))
    );
  }

  return NextResponse.json({ clubId: club.id, redditCount: redditHits.length });
}
