---
name: stalk
description: >
  Use when rushline needs recruiting intel on a campus club or a specific club
  member. Two modes: `person` builds a coffee-chat dossier on an individual;
  `vibe` reads a club's real culture. Synthesizes live X (x_search), Reddit,
  Instagram, LinkedIn, and the club's team page into structured JSON that drops
  straight into rushline's Supabase tables.
---

# /stalk — rushline's intel engine (Grok Build)

This skill turns Grok Build's live search superpowers — especially `x_search`
against the X firehose, which no other tool at the table can touch — into the
ground-truth intel behind rushline's club pages.

## Usage

```
/stalk person "<full name>" "<club>" "<school>"
/stalk vibe "<club>" "<school>"
```

## Mode: person  →  a coffee-chat dossier

Research the individual and return intel that powers "People you should meet"
and the coffee-chat drafter.

Steps:
1. `x_search` the person + club for recent posts, reposts, and what they care about right now.
2. Web-search their LinkedIn and the club team page to confirm role and career trajectory.
3. Find their Instagram handle if public.
4. Identify 2-3 specific, non-generic talking points and the single best ask.

Return ONLY this JSON:
```json
{
  "name": "",
  "role": "",
  "linkedin_url": "",
  "instagram": "@handle or null",
  "email": "guess or null",
  "career_tags": ["consulting|startups|big_tech|quant|finance"],
  "relevance": "why THIS person matters to the user's goal, one sentence",
  "is_alumni": false,
  "talking_points": ["", "", ""],
  "best_ask": ""
}
```

## Mode: vibe  →  the club's real culture

Read what the club is *actually* like, not its self-description. This feeds the
"Vibe & Culture" card.

Steps:
1. `x_search` the club name + school for the last ~6 months of chatter (members, rush posts, drama, memes).
2. Pull the school subreddit via `reddit.com/r/<sub>/search.json?q="<club>"&restrict_sr=1`.
3. Check the club Instagram for social cadence (retreats, parties, formals vs. info sessions).
4. Synthesize into culture, selectivity, intensity, social energy, and core values.

Return ONLY this JSON:
```json
{
  "headline": "one punchy line capturing the vibe",
  "culture": "2-3 sentences on what it's really like inside",
  "selectivity": "e.g. ~5% accept",
  "intensity": "e.g. High (15+ hrs/wk)",
  "social_energy": "e.g. Professional-first | Warm & social | Casual & nerdy",
  "values": ["", "", ""],
  "x_sentiment": {
    "summary": "what X specifically says",
    "posts": [{"text": "", "handle": "@", "url": ""}]
  },
  "reddit_sentiment": {"summary": "", "vibe": "positive|mixed|negative"},
  "source_note": "Synthesized from live X + Reddit + Instagram"
}
```

## Loading results into rushline

Paste the JSON into the app's live scraper, or upsert directly:
- `person` → `members` row (+ `talking_points`/`best_ask` feed `/api/draft-email`)
- `vibe` → `club_intel.vibe` and `club_intel.x_sentiment`

## Capturing this skill live (demo)

Do one `person` and one `vibe` research pass manually in Grok Build, then run
`/skillify` to regenerate this file. That "the judge's own tool just became
rushline's engine" moment is the point.
