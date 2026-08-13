/** Normalize a LinkedIn profile URL or path to a lowercase slug. */
export function linkedinSlug(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
    const u = new URL(withProto);
    if (!/linkedin\.com$/i.test(u.hostname.replace(/^www\./, "")) &&
        !u.hostname.toLowerCase().endsWith(".linkedin.com")) {
      // bare slug
      const bare = raw.replace(/^@/, "").replace(/\/+$/, "").split("/").pop();
      return bare && /^[a-zA-Z0-9_-]+$/.test(bare) ? bare.toLowerCase() : null;
    }
    const parts = u.pathname.split("/").filter(Boolean);
    const inIdx = parts.findIndex((p) => p.toLowerCase() === "in");
    if (inIdx >= 0 && parts[inIdx + 1]) {
      return parts[inIdx + 1].replace(/\/+$/, "").toLowerCase();
    }
    return null;
  } catch {
    const bare = raw.replace(/^@/, "").replace(/\/+$/, "").split("/").pop();
    return bare && /^[a-zA-Z0-9_-]+$/.test(bare) ? bare.toLowerCase() : null;
  }
}

export function linkedinProfileUrl(slugOrUrl: string): string {
  const slug = linkedinSlug(slugOrUrl) ?? slugOrUrl;
  return `https://www.linkedin.com/in/${slug}/`;
}
