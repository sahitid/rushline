import * as cheerio from "cheerio";

export type SiteScrape = {
  title: string;
  text: string;
  emails: string[];
  links: { text: string; href: string }[];
};

export async function scrapeClubSite(url: string): Promise<SiteScrape | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; rushline/0.1)" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer").remove();
    const title = $("title").first().text().trim();
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 6000);
    const emails = Array.from(
      new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [])
    );
    const links: { text: string; href: string }[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const t = $(el).text().replace(/\s+/g, " ").trim();
      if (href.startsWith("http") && t) links.push({ text: t, href });
    });
    return { title, text, emails, links: links.slice(0, 40) };
  } catch {
    return null;
  }
}
