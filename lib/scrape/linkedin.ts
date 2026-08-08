import { webSearch } from "./search";
import type { Person } from "../types";

// LinkedIn blocks direct scraping, so we mine search-engine results for
// public profile titles like "Jane Doe - Consultant - Berkeley Consulting | LinkedIn".
export async function findPeopleViaLinkedIn(
  school: string,
  clubName: string
): Promise<Person[]> {
  const queries = [
    `site:linkedin.com/in "${clubName}" "${school}"`,
    `site:linkedin.com/in "${clubName}" president OR consultant OR analyst`,
  ];
  const people: Person[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const results = await webSearch(q, 10);
    for (const r of results) {
      if (!r.url.includes("linkedin.com/in")) continue;
      // Titles look like "Name - Role - Org | LinkedIn" or "Name – Role | LinkedIn"
      const raw = r.title.replace(/\s*\|\s*LinkedIn.*$/i, "").replace(/\s*- LinkedIn.*$/i, "");
      const parts = raw.split(/\s+[-–—]\s+/);
      const name = (parts[0] ?? "").trim();
      if (!name || name.length < 3 || name.length > 40 || seen.has(name.toLowerCase())) continue;
      if (/linkedin|profiles|search/i.test(name)) continue;
      seen.add(name.toLowerCase());

      const role = (parts[1] ?? "Member").trim().slice(0, 70);
      const rest = (parts.slice(1).join(" — ") + " " + r.snippet).toLowerCase();
      const isAlumni =
        /former|ex-|alum|previously/.test(rest) ||
        (!rest.includes(clubName.toLowerCase()) && parts.length > 2);
      const isLeader = /president|vp|vice|director|lead|head|recruit|partner/i.test(role);

      people.push({
        name,
        role,
        linkedinUrl: r.url,
        source: "LinkedIn (via web search)",
        isAlumni,
        contactPriority: isLeader ? 95 : isAlumni ? 75 : 65,
        reason: isLeader
          ? "Leadership — likely reads applications and remembers names"
          : isAlumni
            ? "Alumni — can refer you and speak candidly about the club"
            : "Current member — ideal for a low-stakes coffee chat",
      });
    }
    if (people.length >= 12) break;
  }
  return people.slice(0, 15);
}

export async function findInstagram(school: string, clubName: string): Promise<string | null> {
  const results = await webSearch(`site:instagram.com "${clubName}" ${school}`, 5);
  for (const r of results) {
    const m = r.url.match(/instagram\.com\/([A-Za-z0-9_.]+)\/?$/);
    if (m && !["p", "reel", "explore", "accounts"].includes(m[1])) {
      return `https://www.instagram.com/${m[1]}/`;
    }
  }
  return null;
}
