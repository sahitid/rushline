#!/usr/bin/env python3
"""Sync APPROVED.json (+ first-batch) into Supabase. Skip report-shadowed empties via node parse-packs."""
import json, subprocess, urllib.request
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/workspace/rushline-cornell")
SCRIPTS = ROOT / "scripts"
ENV = {}
for line in (SCRIPTS / ".sb.env").read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        ENV[k] = v
URL = ENV["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = ENV["SUPABASE_SERVICE_ROLE_KEY"]


def api(method, path, body=None, prefer=None, params=""):
    data = None if body is None else json.dumps(body).encode()
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(URL + path + params, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else None


def count_exact(path_with_query):
    """PostgREST exact row count (avoids default 1000-row body limit)."""
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Prefer": "count=exact",
        "Range-Unit": "items",
        "Range": "0-0",
    }
    req = urllib.request.Request(URL + path_with_query, headers=headers, method="GET")
    with urllib.request.urlopen(req) as resp:
        cr = resp.headers.get("content-range") or ""
        total = cr.split("/")[-1]
        return int(total) if total.isdigit() else 0



# Lead HOLD 2026-08-10: Research IG-revised MEMBER packs — skip re-upsert until Bugbot re-gates
MEMBER_HOLD = set()  # Cup final n=2 (Andrew+Ganesh); cleared 2026-08-10 per Lead

def dump_packs():
    subprocess.check_call(
        [
            "node",
            "-e",
            """
import { loadPacksFromDir } from "./parse-packs.mjs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT="/workspace/rushline-cornell";
const by=new Map();
for (const dir of [join(ROOT,"first-batch"), join(ROOT,"expanded"), join(ROOT,"expanded","packs")]) {
  for (const p of loadPacksFromDir(dir)) {
    const prev=by.get(p.slug);
    if (!prev || (p.members?.length||0)>(prev.members?.length||0)) by.set(p.slug,p);
  }
}
writeFileSync("/tmp/sync-all-packs.json", JSON.stringify([...by.values()]));
""",
        ],
        cwd=str(SCRIPTS),
    )
    return {p["slug"]: p for p in json.loads(Path("/tmp/sync-all-packs.json").read_text())}


ALIASES = {
    "cornell-fintech-club": "cornell-fintech-club-cft",
    "cornell-chinese-students-association": "cornell-chinese-students-association-csa",
    "cornell-student-agencies": "cornell-student-agencies-student-agencies-inc",
    "federal-reserve-challenge-club-cornell": "federal-reserve-challenge-club-at-cornell",
    "cornell-marketing-club": "cornell-marketing-club-cmc-cornell-marketing",
    "cornell-economics-society": "cornell-economics-society-ces",
    "cornell-capital-club": "cornell-capital-club-ccc-cap",
    "business-review-at-cornell": "business-review-at-cornell-cbr-cornell-business-review",
    "cornell-ma-club": "cornell-mergers-acquisitions-club",
    "cornell-emerging-markets-institute-club": "emerging-markets-institute-club-emic",
    "south-asian-business-association-saba": "south-asian-business-association-at-cornell-saba",
    "cornell-real-estate-development-investment-trust-credit": "credit-cornell-real-estate-development-investment-trust",
    "business-club-emerging-economies-bcee": "business-club-for-emerging-economies-at-cornell-bcee",
    "cornell-venture-entrepreneurs-cvec": "cornell-venture-and-entrepreneurship-club-cvec",
    "tribeca-club-cornell": "the-tribeca-club-at-cornell",
    "pdow-cornell": "professional-development-of-women-at-cornell-pdow",
    "global-china-connection-cornell": "global-china-connection-at-cornell",
    "forte-campus-cornell": "fort-campus-at-cornell",
    "cornell-society-women-business-swib": "society-for-women-in-business-swib",
    "cornell-entrepreneurship-club": "entrepreneurship-club-at-cornell-cent-cornell-ec",
    "social-enterprise-group-cornell-segc": "social-enterprise-group-at-cornell-segc",
    "tamid-group-cornell": "tamid-group-at-cornell",
    "sustainability-consulting-cornell": "sustainability-consulting-at-cornell",
    "social-enterprise-cornell-sec": "social-enterprise-at-cornell-sec",
    "mutual-investment-club-cornell-micc": "mutual-investment-club-of-cornell-micc",
    "180-degrees-consulting-cornell": "180-degrees-consulting-at-cornell",
    "design-consulting-cornell-dcc": "design-consulting-at-cornell-dcc",
    "consult-your-community-cornell": "consult-your-community-at-cornell-cyc",
    "cornell-ai-strategy-club": "cornell-ai-strategy-club-cais",
    "cusail": "cornell-autonomous-sailboat-team-cusail",
    "startup-consulting-cornell": "startup-consulting-at-cornell",
    "global-research-consulting-cornell": "global-research-consulting-group-cornell",
    "christian-business-society-cornell": "christian-business-society-at-cornell",
    "impact-investing-cornell": "impact-investing-at-cornell",
}


def resolve(slug, packs):
    if slug in packs:
        return packs[slug]
    if slug in ALIASES and ALIASES[slug] in packs:
        return packs[ALIASES[slug]]
    cands = [p for s, p in packs.items() if slug in s or s in slug]
    return cands[0] if len(cands) == 1 else None


def upsert(pack):
    row = {
        "school": "Cornell",
        "name": pack["name"],
        "slug": pack["slug"],
        "category": pack.get("category"),
        "website": pack.get("website"),
        "tagline": pack.get("tagline"),
    }
    club = api(
        "POST",
        "/rest/v1/clubs",
        [row],
        prefer="resolution=merge-duplicates,return=representation",
        params="?on_conflict=school,slug",
    )[0]
    intel = {
        "club_id": club["id"],
        "review": pack.get("review"),
        "clients": [],
        "retreats": [],
        "interview": pack.get("interview") or {},
        "reddit_sentiment": pack.get("reddit_sentiment") or {},
        "vibe": pack.get("vibe") or {},
        "x_sentiment": pack.get("x_sentiment") or {},
        "sources": pack.get("sources") or [],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    api(
        "POST",
        "/rest/v1/club_intel",
        [intel],
        prefer="resolution=merge-duplicates,return=minimal",
        params="?on_conflict=club_id",
    )
    rows = []
    for m in pack.get("members") or []:
        if not m.get("name"):
            continue
        tp = m.get("talking_points") or []
        if isinstance(tp, str):
            tp = [tp]
        # Never send null linkedin_url/instagram/email — PostgREST merge-duplicates
        # would wipe live enrichment when disk packs are thinner (Wave A LI backfills).
        row = {
            "club_id": club["id"],
            "name": m["name"],
            "role": m.get("role"),
            "career_tags": m.get("career_tags") or [],
            "relevance": m.get("relevance"),
            "is_alumni": bool(m.get("is_alumni")),
            "talking_points": tp,
            "best_ask": m.get("best_ask"),
        }
        li = (m.get("linkedin_url") or m.get("linkedin") or "").strip()
        if li:
            row["linkedin_url"] = li
        ig = (m.get("instagram") or "").strip()
        if ig:
            row["instagram"] = ig
        em = (m.get("email") or "").strip()
        if em:
            row["email"] = em
        rows.append(row)
    # PostgREST PGRST102: all objects in one POST must share the same keys.
    # Null-omit means some rows lack linkedin_url/instagram/email — group by key set.
    from collections import defaultdict
    groups = defaultdict(list)
    for row in rows:
        groups[frozenset(row.keys())].append(row)
    for bucket in groups.values():
        for i in range(0, len(bucket), 50):
            api(
                "POST",
                "/rest/v1/members",
                bucket[i : i + 50],
                prefer="resolution=merge-duplicates,return=minimal",
                params="?on_conflict=club_id,name",
            )
    return club["slug"], len(rows)


def main():
    packs = dump_packs()
    approved = json.loads((ROOT / "expanded" / "APPROVED.json").read_text())
    allow = approved.get("approved_slugs") or []
    # always include first-batch
    for slug in ["cornell-appdev", "cuauv", "kappa-theta-pi-ktp", "wicc"]:
        if slug not in allow:
            allow.append(slug)

    db = {c["slug"] for c in api("GET", "/rest/v1/clubs", params="?school=eq.Cornell&select=slug")}
    loaded = []
    missing = []
    for slug in allow:
        p = resolve(slug, packs)
        if not p:
            missing.append(slug)
            continue
        # skip empty vibe-only if already present
        if not p.get("members") and p["slug"] in db:
            continue
        # HOLD: do not overwrite Bugbot-gated MEMBER packs with IG revises
        if p["slug"] in MEMBER_HOLD:
            continue
        s, n = upsert(p)
        loaded.append((s, n))
        db.add(s)

    clubs = api("GET", "/rest/v1/clubs", params="?school=eq.Cornell&select=id&limit=1000")
    ids = ",".join(c["id"] for c in clubs)
    club_n = count_exact("/rest/v1/clubs?school=eq.Cornell&select=id")
    member_n = (
        count_exact(f"/rest/v1/members?club_id=in.({ids})&select=id") if clubs else 0
    )
    summary = {
        "clubs": club_n,
        "members": member_n,
        "approved_slugs": len(allow),
        "disk_packs": len(packs),
        "upserted": loaded,
        "missing_on_disk": missing,
    }
    Path("/tmp/sync-approved-summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
