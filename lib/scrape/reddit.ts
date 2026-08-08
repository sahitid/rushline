import { fetchJson } from "./http";
import type { RedditPost } from "../types";

interface RedditListing {
  data?: {
    children?: {
      data: {
        title?: string;
        selftext?: string;
        body?: string;
        permalink: string;
        subreddit: string;
        score: number;
        created_utc: number;
      };
    }[];
  };
}

const SCHOOL_SUBREDDITS: Record<string, string> = {
  berkeley: "berkeley",
  "uc berkeley": "berkeley",
  cornell: "Cornell",
  stanford: "stanford",
  ucla: "ucla",
  michigan: "uofm",
  nyu: "nyu",
  usc: "USC",
};

export function schoolSubreddit(school: string): string | null {
  const key = school.toLowerCase().trim();
  for (const [k, v] of Object.entries(SCHOOL_SUBREDDITS)) {
    if (key.includes(k)) return v;
  }
  return null;
}

async function searchListing(url: string): Promise<RedditPost[]> {
  const json = await fetchJson<RedditListing>(url);
  const children = json?.data?.children ?? [];
  return children.map((c) => ({
    title: c.data.title ?? "(comment)",
    url: `https://www.reddit.com${c.data.permalink}`,
    subreddit: c.data.subreddit,
    snippet: (c.data.selftext || c.data.body || "").slice(0, 1200),
    score: c.data.score,
    createdUtc: c.data.created_utc,
  }));
}

export async function scrapeReddit(school: string, clubName: string): Promise<RedditPost[]> {
  const sub = schoolSubreddit(school);
  const q = encodeURIComponent(`"${clubName}"`);
  const urls: string[] = [];
  if (sub) {
    urls.push(
      `https://www.reddit.com/r/${sub}/search.json?q=${q}&restrict_sr=1&sort=relevance&limit=15`
    );
  }
  urls.push(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(clubName + " " + school)}&sort=relevance&limit=10`
  );

  const results = await Promise.all(urls.map(searchListing));
  const seen = new Set<string>();
  const posts: RedditPost[] = [];
  for (const batch of results) {
    for (const p of batch) {
      if (seen.has(p.url)) continue;
      seen.add(p.url);
      posts.push(p);
    }
  }
  return posts.sort((a, b) => b.score - a.score).slice(0, 20);
}
