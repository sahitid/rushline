export type RedditHit = {
  title: string;
  url: string;
  snippet: string;
  score: number;
  subreddit: string;
};

const SCHOOL_SUBREDDIT: Record<string, string> = {
  "uc berkeley": "berkeley",
  berkeley: "berkeley",
  "cal": "berkeley",
  stanford: "stanford",
  ucla: "ucla",
  usc: "USC",
  mit: "mit",
};

export function subredditFor(school: string): string {
  const key = school.trim().toLowerCase();
  return SCHOOL_SUBREDDIT[key] ?? key.replace(/[^a-z]/g, "");
}

export async function searchReddit(
  school: string,
  clubName: string
): Promise<RedditHit[]> {
  const sub = subredditFor(school);
  const q = encodeURIComponent(`"${clubName}"`);
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${q}&restrict_sr=1&sort=relevance&limit=10`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "rushline/0.1 (hackathon demo)" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const children = data?.data?.children ?? [];
    return children.map((c: { data: Record<string, unknown> }) => {
      const d = c.data;
      return {
        title: String(d.title ?? ""),
        url: `https://www.reddit.com${String(d.permalink ?? "")}`,
        snippet: String(d.selftext ?? "").slice(0, 280),
        score: Number(d.score ?? 0),
        subreddit: sub,
      };
    });
  } catch {
    return [];
  }
}
