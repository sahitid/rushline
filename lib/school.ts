export const SCHOOLS = ["UC Berkeley", "Cornell"] as const;
export type School = (typeof SCHOOLS)[number];

export const DEFAULT_SCHOOL: School = "UC Berkeley";
export const SCHOOL_STORAGE_KEY = "rushline.school";

/** Map free-text / profile / DB values onto the two supported schools. */
export function normalizeSchool(raw?: string | null): School | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s === "cornell" || s.startsWith("cornell ")) return "Cornell";
  if (
    s === "uc berkeley" ||
    s === "berkeley" ||
    s === "cal" ||
    s.startsWith("university of california")
  ) {
    return "UC Berkeley";
  }
  // Exact canonical already
  if (s === "uc berkeley") return "UC Berkeley";
  return null;
}

export function schoolMatches(clubSchool: string | null | undefined, selected: School): boolean {
  const n = normalizeSchool(clubSchool);
  return n === selected;
}

export function schoolShortLabel(school: School): string {
  return school === "UC Berkeley" ? "Berkeley" : "Cornell";
}

export function readStoredSchool(): School | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeSchool(window.localStorage.getItem(SCHOOL_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredSchool(school: School) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCHOOL_STORAGE_KEY, school);
  } catch {
    /* ignore */
  }
}

/** Resolve school: query param → localStorage → profile → default Berkeley. */
export function resolveSchool(opts: {
  querySchool?: string | null;
  profileSchool?: string | null;
}): School {
  return (
    normalizeSchool(opts.querySchool) ??
    readStoredSchool() ??
    normalizeSchool(opts.profileSchool) ??
    DEFAULT_SCHOOL
  );
}
