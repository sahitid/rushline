# rushline

Recruit for competitive campus clubs with an insider's information advantage.
rushline aggregates real scraped signals — club sites, Reddit, live X chatter,
and member profiles — into personalized club pages built from ground truth, not
self-reported blurbs.

Built for the Fall 2026 Cursor Campus Cup. Demo target: UC Berkeley consulting
clubs. The pipeline is school-agnostic.

## Features

- **Auth + onboarding** (Supabase) — school, career goal, target club types, LinkedIn.
- **Clubs feed** — ranked matches with reasoning tied to your goals.
- **Club detail pages** — review + sources, client history, retreats, interview
  intel, Reddit sentiment, member roster, "people you should meet," and a
  **Vibe & Culture** card powered by the Grok `/stalk` skill.
- **Coffee-chat outreach** — LLM-drafted personalized emails with pre-chat tips,
  `mailto:` send + Google Calendar link, and LinkedIn/Instagram deep links.
- **Social web** — an interactive force-directed graph of your network and the
  shortest path into your top target club.
- **Live scraper** — type any `school + club` to scrape Reddit + the club site
  and synthesize intel on the fly.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase (auth + Postgres)
- AI SDK v6 (`ai` + `@ai-sdk/openai`) — optional; falls back to templates
- `cheerio` + Reddit public JSON API for scraping
- `react-force-graph-2d` for the social web
- Grok Build `/stalk` skill (see `.grok/skills/stalk/SKILL.md`) as the intel engine

## Setup

```bash
npm install
cp .env.local.example .env.local   # already populated with Supabase creds
# Optional: add OPENAI_API_KEY to .env.local for LLM summaries + email drafting
npm run dev
```

Open http://localhost:3000.

Environment variables (`.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional — without it, summaries/emails use high-quality templates)

## The Grok `/stalk` skill

`/stalk` is rushline's intel engine, captured in Grok Build via `/skillify`. Two modes:

- `/stalk person "<name>" "<club>" "<school>"` → a coffee-chat dossier (LinkedIn,
  Instagram, X, talking points) that feeds "people you should meet."
- `/stalk vibe "<club>" "<school>"` → the Vibe & Culture read, synthesized from
  live X (`x_search`), Reddit, and Instagram — the differentiator no non-Grok
  tool can replicate.

Both modes emit structured JSON that upserts into the `members` and `club_intel`
tables. See `.grok/skills/stalk/SKILL.md`.

## Demo flow

1. Sign up → onboarding (school, goals, LinkedIn).
2. See matched Berkeley consulting clubs, ranked to your goal.
3. Open a club page — clients, retreats, interview intel, Reddit sentiment, and
   the Grok-powered Vibe & Culture card.
4. Draft a coffee-chat email to a recommended member, with pre-chat tips.
5. Open the social web — your network and the highlighted path into your target.
6. Bonus: run the live scraper on any school + club the judges name.
