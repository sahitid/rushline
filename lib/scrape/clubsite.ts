import * as cheerio from "cheerio";
import { fetchText } from "./http";
import type { Person } from "../types";

export interface ClubSiteData {
  description: string;
  clients: string[];
  retreats: string[];
  people: Person[];
  contactEmail: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  applicationUrl: string | null;
  pagesVisited: string[];
}

const CLIENT_STOPWORDS = new Set([
  "home", "about", "team", "contact", "apply", "join", "services", "projects",
  "clients", "our clients", "past clients", "learn more", "read more", "view all",
]);

function absolutize(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function extractEmails(html: string): string[] {
  const matches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:edu|com|org)/g) ?? [];
  return [...new Set(matches.filter((e) => !e.includes("example") && !e.includes("wixpress") && !e.includes("sentry")))];
}

function extractSocials($: cheerio.CheerioAPI, base: string) {
  let instagramUrl: string | null = null;
  let linkedinUrl: string | null = null;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!instagramUrl && href.includes("instagram.com/") && !href.includes("/p/")) {
      instagramUrl = absolutize(base, href);
    }
    if (!linkedinUrl && href.includes("linkedin.com/company")) {
      linkedinUrl = absolutize(base, href);
    }
  });
  return { instagramUrl, linkedinUrl };
}

function extractApplicationUrl($: cheerio.CheerioAPI, base: string): string | null {
  let found: string | null = null;
  $("a[href]").each((_, el) => {
    if (found) return;
    const text = $(el).text().toLowerCase();
    const href = $(el).attr("href") ?? "";
    if (/apply|application|join us|recruit/i.test(text) || /apply|recruit/i.test(href)) {
      const abs = absolutize(base, href);
      if (abs && !abs.startsWith("mailto:")) found = abs;
    }
  });
  return found;
}

function extractDescription($: cheerio.CheerioAPI): string {
  const meta =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content");
  if (meta && meta.length > 40) return meta.trim();
  // Longest early paragraph as fallback
  let best = "";
  $("p").each((i, el) => {
    if (i > 15) return;
    const t = $(el).text().trim();
    if (t.length > best.length && t.length < 600) best = t;
  });
  return best;
}

function extractClients($: cheerio.CheerioAPI, html: string): string[] {
  const clients = new Set<string>();
  // Strategy 1: sections whose heading mentions clients/partners
  $("h1, h2, h3, h4").each((_, el) => {
    const heading = $(el).text().toLowerCase();
    if (!/client|partner|worked with|companies/.test(heading)) return;
    const section = $(el).parent();
    section.find("img[alt]").each((_, img) => {
      const alt = ($(img).attr("alt") ?? "").replace(/\s*logo\s*/i, "").trim();
      if (alt.length > 1 && alt.length < 40 && !/icon|image|photo/i.test(alt)) {
        clients.add(alt);
      }
    });
    section.find("li, h5, h6, strong").each((_, li) => {
      const t = $(li).text().trim();
      if (t.length > 1 && t.length < 40 && !CLIENT_STOPWORDS.has(t.toLowerCase())) clients.add(t);
    });
  });
  // Strategy 2: well-known company names appearing in body text
  const knownCompanies = [
    "Google", "Meta", "Amazon", "Microsoft", "Apple", "Netflix", "Uber", "Lyft",
    "Airbnb", "Tesla", "Salesforce", "Adobe", "Nike", "Pepsi", "PepsiCo", "Coca-Cola",
    "Disney", "Spotify", "DoorDash", "Instacart", "Stripe", "Visa", "Mastercard",
    "McKinsey", "Bain", "BCG", "Deloitte", "Accenture", "PwC", "EY", "KPMG",
    "Goldman Sachs", "JPMorgan", "Morgan Stanley", "BlackRock", "Citadel",
    "Tinder", "Reddit", "LinkedIn", "Snapchat", "TikTok", "Pinterest", "Roblox",
    "Warner Bros", "Sony", "Samsung", "Intel", "NVIDIA", "AMD", "Cisco", "IBM",
    "Walmart", "Target", "Costco", "Sephora", "L'Oreal", "Unilever",
  ];
  const text = html.replace(/<[^>]+>/g, " ");
  for (const c of knownCompanies) {
    if (new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)) {
      clients.add(c);
    }
  }
  return [...clients].filter((c) => c.length > 1).slice(0, 25);
}

function extractRetreats(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const out: string[] = [];
  const re = /[^.!?]*\b(retreat|tahoe|cabo|vegas|napa|big bear|socal trip|formal|banquet)\b[^.!?]*[.!?]/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(text)) && out.length < 5) {
    const sentence = m[0].trim();
    if (sentence.length > 20 && sentence.length < 300 && !seen.has(sentence.toLowerCase())) {
      seen.add(sentence.toLowerCase());
      out.push(sentence);
    }
  }
  return out;
}

function extractPeople($: cheerio.CheerioAPI, sourceUrl: string): Person[] {
  const people: Person[] = [];
  const seen = new Set<string>();
  // LinkedIn profile links near names
  $('a[href*="linkedin.com/in"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const container = $(el).closest("div, li, article");
    let name = $(el).text().trim();
    if (!name || name.length < 3 || /linkedin/i.test(name)) {
      name = container.find("h1, h2, h3, h4, h5, strong").first().text().trim();
    }
    if (!name || name.length < 3 || name.length > 50 || seen.has(name.toLowerCase())) return;
    const role = container.find("p, span, h6").first().text().trim().slice(0, 60);
    seen.add(name.toLowerCase());
    people.push({
      name,
      role: role && role !== name ? role : "Member",
      linkedinUrl: href.startsWith("http") ? href : undefined,
      source: sourceUrl,
      isAlumni: /alum/i.test(role),
      contactPriority: /president|vp|director|lead|recruit/i.test(role) ? 90 : 60,
      reason: /president|vp|director|lead/i.test(role)
        ? "Leadership — likely involved in recruiting decisions"
        : "Current member — good for an honest coffee chat",
    });
  });
  return people.slice(0, 30);
}

async function findTeamPage($: cheerio.CheerioAPI, base: string): Promise<string | null> {
  let teamUrl: string | null = null;
  $("a[href]").each((_, el) => {
    if (teamUrl) return;
    const text = $(el).text().toLowerCase();
    const href = $(el).attr("href") ?? "";
    if (/^(our )?(team|members|people|leadership)$/i.test(text.trim()) || /\/(team|members|people|leadership)\/?$/i.test(href)) {
      teamUrl = absolutize(base, href);
    }
  });
  return teamUrl;
}

export async function scrapeClubSite(url: string): Promise<ClubSiteData | null> {
  const html = await fetchText(url);
  if (!html) return null;
  const $ = cheerio.load(html);
  const pagesVisited = [url];

  const socials = extractSocials($, url);
  const emails = extractEmails(html);
  let people = extractPeople($, url);
  let clients = extractClients($, html);
  let retreats = extractRetreats(html);

  // Visit team page for more people
  const teamUrl = await findTeamPage($, url);
  if (teamUrl && teamUrl !== url) {
    const teamHtml = await fetchText(teamUrl);
    if (teamHtml) {
      pagesVisited.push(teamUrl);
      const $t = cheerio.load(teamHtml);
      const morePeople = extractPeople($t, teamUrl);
      const names = new Set(people.map((p) => p.name.toLowerCase()));
      for (const p of morePeople) {
        if (!names.has(p.name.toLowerCase())) people.push(p);
      }
      people = people.slice(0, 30);
    }
  }

  // Visit a clients/projects page if linked
  let clientsUrl: string | null = null;
  $("a[href]").each((_, el) => {
    if (clientsUrl) return;
    const text = $(el).text().toLowerCase().trim();
    if (/^(our )?(clients|projects|work|portfolio)$/.test(text)) {
      clientsUrl = absolutize(url, $(el).attr("href") ?? "");
    }
  });
  if (clientsUrl && clientsUrl !== url) {
    const cHtml = await fetchText(clientsUrl);
    if (cHtml) {
      pagesVisited.push(clientsUrl);
      const $c = cheerio.load(cHtml);
      clients = [...new Set([...clients, ...extractClients($c, cHtml)])].slice(0, 25);
      retreats = [...new Set([...retreats, ...extractRetreats(cHtml)])].slice(0, 5);
    }
  }

  return {
    description: extractDescription($),
    clients,
    retreats,
    people,
    contactEmail: emails[0] ?? null,
    instagramUrl: socials.instagramUrl,
    linkedinUrl: socials.linkedinUrl,
    applicationUrl: extractApplicationUrl($, url),
    pagesVisited,
  };
}
