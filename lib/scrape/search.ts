import * as cheerio from "cheerio";
import { fetchText } from "./http";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function decodeDdgUrl(href: string): string | null {
  // DDG wraps results as //duckduckgo.com/l/?uddg=<encoded>&rut=...
  if (href.includes("uddg=")) {
    try {
      const u = new URL(href.startsWith("//") ? "https:" + href : href);
      const target = u.searchParams.get("uddg");
      return target ? decodeURIComponent(target) : null;
    } catch {
      return null;
    }
  }
  if (href.startsWith("http")) return href;
  return null;
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  );
  if (!html) return [];
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];
  $(".result").each((_, el) => {
    const a = $(el).find("a.result__a").first();
    const href = a.attr("href");
    if (!href) return;
    const url = decodeDdgUrl(href);
    if (!url || url.includes("duckduckgo.com")) return;
    results.push({
      title: a.text().trim(),
      url,
      snippet: $(el).find(".result__snippet").text().trim(),
    });
  });
  return results;
}

async function searchBing(query: string): Promise<SearchResult[]> {
  const html = await fetchText(`https://www.bing.com/search?q=${encodeURIComponent(query)}`);
  if (!html) return [];
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];
  $("li.b_algo").each((_, el) => {
    const a = $(el).find("h2 a").first();
    const href = a.attr("href");
    if (!href || !href.startsWith("http")) return;
    results.push({
      title: a.text().trim(),
      url: href,
      snippet: $(el).find(".b_caption p").text().trim(),
    });
  });
  return results;
}

export async function webSearch(query: string, limit = 10): Promise<SearchResult[]> {
  let results = await searchDuckDuckGo(query);
  if (results.length === 0) {
    results = await searchBing(query);
  }
  return results.slice(0, limit);
}
