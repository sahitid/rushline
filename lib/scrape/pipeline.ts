import type { ClubIntel, Person } from "../types";
import { getUser } from "../db";
import { webSearch } from "./search";
import { scrapeClubSite } from "./clubsite";
import { scrapeReddit } from "./reddit";
import { findInstagram, findPeopleViaLinkedIn } from "./linkedin";
import {
  computeMatch,
  extractInterviewIntel,
  generateCoffeeChatTips,
  generateEmailDraft,
  inferCategory,
} from "../synthesize";

const BAD_HOSTS = [
  "linkedin.com", "instagram.com", "facebook.com", "reddit.com", "twitter.com",
  "x.com", "youtube.com", "tiktok.com", "wikipedia.org", "niche.com", "yelp.com",
];

async function findClubWebsite(
  school: string,
  clubName: string,
  log: string[]
): Promise<string | null> {
  const results = await webSearch(`${clubName} ${school} club official website`, 10);
  log.push(`Web search returned ${results.length} results for the club website`);
  for (const r of results) {
    try {
      const host = new URL(r.url).hostname;
      if (BAD_HOSTS.some((b) => host.includes(b))) continue;
      // Prefer results whose title mentions the club name
      const titleLower = r.title.toLowerCase();
      const nameWords = clubName.toLowerCase().split(/\s+/);
      const hits = nameWords.filter((w) => titleLower.includes(w)).length;
      if (hits >= Math.min(2, nameWords.length)) return r.url;
    } catch {
      continue;
    }
  }
  return results.find((r) => {
    try {
      return !BAD_HOSTS.some((b) => new URL(r.url).hostname.includes(b));
    } catch {
      return false;
    }
  })?.url ?? null;
}

function mergePeople(a: Person[], b: Person[]): Person[] {
  const seen = new Set(a.map((p) => p.name.toLowerCase()));
  const merged = [...a];
  for (const p of b) {
    if (!seen.has(p.name.toLowerCase())) {
      seen.add(p.name.toLowerCase());
      merged.push(p);
    }
  }
  return merged.sort((x, y) => y.contactPriority - x.contactPriority).slice(0, 30);
}

export async function scrapeClub(
  school: string,
  clubName: string
): Promise<Omit<ClubIntel, "id">> {
  const log: string[] = [];
  const started = Date.now();

  const websiteUrl = await findClubWebsite(school, clubName, log);
  log.push(websiteUrl ? `Found club website: ${websiteUrl}` : "No club website found");

  // Run the independent scrapes concurrently
  const [site, redditPosts, linkedinPeople, instagramFromSearch] = await Promise.all([
    websiteUrl ? scrapeClubSite(websiteUrl) : Promise.resolve(null),
    scrapeReddit(school, clubName),
    findPeopleViaLinkedIn(school, clubName),
    findInstagram(school, clubName),
  ]);

  if (site) log.push(`Scraped ${site.pagesVisited.length} page(s) from the club site`);
  log.push(`Found ${redditPosts.length} Reddit threads mentioning the club`);
  log.push(`Found ${linkedinPeople.length} people via LinkedIn search results`);

  const people = mergePeople(site?.people ?? [], linkedinPeople);
  const description =
    site?.description ||
    redditPosts[0]?.snippet.slice(0, 200) ||
    `${clubName} at ${school}`;
  const category = inferCategory(clubName + " " + description);
  const siteText = description + " " + (site?.clients ?? []).join(" ");

  const interview = extractInterviewIntel(redditPosts, siteText);
  const user = getUser();
  const match = computeMatch(user, clubName + " " + description + " " + category, category);
  const topContact = people[0] ?? null;

  log.push(`Pipeline finished in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  return {
    school,
    name: clubName,
    websiteUrl,
    instagramUrl: site?.instagramUrl ?? instagramFromSearch,
    linkedinUrl: site?.linkedinUrl ?? null,
    applicationUrl: site?.applicationUrl ?? null,
    contactEmail: site?.contactEmail ?? null,
    description,
    category,
    clients: site?.clients ?? [],
    retreats: site?.retreats ?? [],
    people,
    redditPosts,
    interview,
    emailDraft: generateEmailDraft(user, clubName, topContact, site?.clients ?? []),
    coffeeChatTips: generateCoffeeChatTips(clubName, site?.clients ?? [], people, interview),
    matchScore: match.score,
    matchReasons: match.reasons,
    scrapedAt: Date.now(),
    scrapeLog: log,
  };
}
