import Database from "better-sqlite3";
import path from "path";
import type { ClubIntel, UserProfile } from "./types";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(path.join(process.cwd(), "rushline.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school TEXT NOT NULL,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      scraped_at INTEGER NOT NULL,
      UNIQUE(school, name)
    );
  `);
  return db;
}

export function saveUser(profile: Omit<UserProfile, "id">): UserProfile {
  const d = getDb();
  const full = { ...profile, id: 1 };
  d.prepare(
    "INSERT INTO user (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
  ).run(JSON.stringify(full));
  return full;
}

export function getUser(): UserProfile | null {
  const row = getDb().prepare("SELECT data FROM user WHERE id = 1").get() as
    | { data: string }
    | undefined;
  return row ? (JSON.parse(row.data) as UserProfile) : null;
}

export function saveClub(club: Omit<ClubIntel, "id">): ClubIntel {
  const d = getDb();
  const existing = d
    .prepare("SELECT id FROM clubs WHERE school = ? AND name = ?")
    .get(club.school, club.name) as { id: number } | undefined;
  if (existing) {
    const full = { ...club, id: existing.id };
    d.prepare("UPDATE clubs SET data = ?, scraped_at = ? WHERE id = ?").run(
      JSON.stringify(full),
      club.scrapedAt,
      existing.id
    );
    return full;
  }
  const info = d
    .prepare("INSERT INTO clubs (school, name, data, scraped_at) VALUES (?, ?, ?, ?)")
    .run(club.school, club.name, JSON.stringify({ ...club, id: 0 }), club.scrapedAt);
  const id = Number(info.lastInsertRowid);
  const full = { ...club, id };
  d.prepare("UPDATE clubs SET data = ? WHERE id = ?").run(JSON.stringify(full), id);
  return full;
}

export function getClubs(): ClubIntel[] {
  const rows = getDb().prepare("SELECT data FROM clubs ORDER BY scraped_at DESC").all() as {
    data: string;
  }[];
  return rows.map((r) => JSON.parse(r.data) as ClubIntel);
}

export function getClub(id: number): ClubIntel | null {
  const row = getDb().prepare("SELECT data FROM clubs WHERE id = ?").get(id) as
    | { data: string }
    | undefined;
  return row ? (JSON.parse(row.data) as ClubIntel) : null;
}

export function deleteClub(id: number): void {
  getDb().prepare("DELETE FROM clubs WHERE id = ?").run(id);
}
