# Mana — Module Ideas

Brainstorm of potential new product modules for the unified Mana app
(`apps/mana/apps/web/src/lib/modules/`). Captured 2026-04-09.

The app currently ships **37 modules**. Each idea below is a candidate for a
new `modules/{name}/` folder following the standard module pattern
(`module.config.ts`, `collections.ts`, `queries.ts`, `stores/*.svelte.ts`,
plus a route under `(app)/{name}/`).

Most user-typed content should default to **encrypted** (see
`apps/mana/apps/web/src/lib/data/crypto/registry.ts`). Modules marked **(ZK)**
are sensitive enough that zero-knowledge mode should be the default
recommendation.

---

## Current modules (for reference)

**Productivity:** todo, calendar, contacts, notes, habits, times, timeblocks, events
**Knowledge & learning:** cards, zitare, guides, questions, skilltree, memoro, context
**Health & self:** nutriphi, cycles, dreams, moodlit, plants
**Media & creative:** chat, picture, presi, music, photos, storage, uload
**Data & tools:** finance, calc, inventory, places, citycorners, who, news, links, tags, playground

---

## Health & Body

- **body** — ✅ **Built.** Combined fitness training + body composition tracking. Workouts/sets with progressive overload, weight + measurements + body fat, daily energy/sleep/soreness checks, cut/bulk/maintenance phases. Lives at `apps/mana/apps/web/src/lib/modules/body/`. The fitness/bodylog merger was the right call — the value lives in their intersection (volume vs. bodyweight, lifts inside a cut).
- **sleep** — Sleep phases, link to `dreams`, bedtime habit integration
- **meds** — Medications/supplements, reminders, interactions, history log
- **therapy** *(ZK)* — Session notes, mood timelines, homework

## Mind & Reflection

- **journal** — Daily freeform entries with mood, tags, "on this day" recap
- **gratitude** — 3-things-a-day micro-module with streaks
- **values** — Personal values/principles, monthly check-in, ties to `habits`
- **decisions** — Decision journal: assumptions, expected outcome, later review
- **letters** — Letters to your future self (time-locked unlock)

## Knowledge & Creativity

- **bookmarks** — Read-later with auto-extract via `mana-crawler`, tags, highlights
- **highlights** — Book/article quotes + spaced-repetition resurfacing (Readwise-style)
- **library** — Books/films/games/podcasts: wishlist → in progress → done, ratings
- **ideas** — Idea inbox with "cooking" status, links to `notes` and `cards`
- **wiki** — Personal Zettelkasten/wiki with backlinks (Obsidian-style), built on `notes`
- **research** — Topic-based folders: sources, notes, syntheses, AI summaries
- **prompts** — LLM prompt library with variables, versions, captured outputs

## Lifestyle & Hobbies

- **recipes** — Recipes (linked to `nutriphi`), meal plan, shopping list generator
- **wardrobe** — Catalog clothing, build outfits, "last worn", wash status
- **travel** — Trips, itineraries, packing lists, travelogue (combines `places` + `photos`)
- **packing** — Reusable packing list templates per trip type
- **garage** — Car/bike: maintenance, fuel stops, repairs, inspection reminders
- **collections** — Generic collector (vinyl, sneakers, LEGO, coins) with custom fields

## Social & Relationships

- **birthdays** — Standalone from `contacts`: reminders, gift ideas, past gifts
- **gifts** — Gift ideas per person, budget, status (idea → bought → given)
- **interactions** — CRM-light: last contact, "ping it" reminders for relationship upkeep
- **family** — Family tree, shared memories, family lore

## Money & Stuff

- **subscriptions** — Track subscriptions, renewal alerts, annual cost overview, cancel links
- **budgets** — Budget buckets layered on `finance`, savings goals
- **invoices** — Issue invoices (freelancer), status, dunning
- **warranties** — Receipts/warranties, expiry alerts (links to `inventory`)
- **lending** — What you've lent / borrowed (books, tools, money)

## Home & Living

- **home** — Household tasks, maintenance plan (filter changes, chimney sweep), contracts
- **chores** — Recurring household tasks with rotation across roommates
- **shopping** — Universal shopping lists, stores, price comparisons
- **pantry** — Pantry stock with expiry, generates shopping list, links to `recipes`

## Work & Goals

- **goals** — OKRs/quarterly goals, key results, weekly check-in
- **projects** — Generic project module (beyond `todo`): phases, stakeholders, risks
- **standup** — Daily done/doing/blockers log (works for solos too)
- **meetings** — Meeting notes with attendees from `contacts`, action items → `todo`
- **timesheet** — Time tracking per project (extension of `times`), invoice export
- **interviews** — Interview tracker (as candidate or recruiter)

## Playful & Creative

- **streaks** — Pure streak visualizer across all modules (habits, journal, etc.)
- **bucket** — Bucket list with status, completion photos
- **quests** — Gamified self-challenges, RPG-style XP feeding `skilltree`
- **moodboard** — Visual inspiration boards (combines `picture`/`bookmarks`)
- **sketchbook** — Quick browser-canvas doodles, dated
- **soundbites** — Short audio memos, transcribed via `mana-stt`
- **timecapsule** — Save content today, unlock in X years

## People in your life

- **kids** *(ZK)* — Milestones, illnesses, growth, photos
- **pets** — Vet appointments, vaccinations, feeding, weight
- **plants-care** — Extension of `plants`: watering plan, fertilizing, repotting

## Health & Body (additional)

- **drink** — ✅ **Built.** Getränke-Tracker für alle Getränke (Wasser, Kaffee, Tee, Saft, Alkohol etc.). Tages-/Wochenziele, Favoriten, Verlauf. Verknüpfung mit `nutriphi` und `body`.
- **stretch** — ✅ **Built.** Geführtes Dehnen mit Timer-Player, Bestandsaufnahme, Routinen, Streaks, Erinnerungen. 22 Seed-Übungen, 5 Preset-Routinen.
- **breathe** — Atemübungen & Meditation-Timer mit geführten Mustern (Box Breathing, 4-7-8). Sessions-Log verknüpft mit `moodlit`.
- **fasting** — Intervallfasten-Timer (16:8, 18:6, OMAD, custom). Essensfenster visualisieren, Fasten-Streak. Synergie: `nutriphi` (Mahlzeiten im Essensfenster), `drink` (Wasser während Fastenphase).
- **posture** — Haltungs-Checks zu konfigurierbaren Zeiten ("Sitzt du gerade?"). Foto-basiertes Tracking (Seitenansicht-Selfie → Vorher/Nachher). Übungsbibliothek für Haltungskorrektur. Arbeitsplatz-Ergonomie-Checkliste. Synergie: `stretch` (Routine-Empfehlung), `body` (Kraftübungen für Haltung).
- **skin** — Hautpflege-Routinen (morgens/abends: Produkte + Reihenfolge). Hautzustand-Logging (Foto + Bewertung: Unreinheiten, Trockenheit, Rötung). Produkt-Bibliothek mit Inhaltsstoffen. Trigger-Tracking (Ernährung, Stress, Schlaf → Hautveränderung).
- **eyes** — 20-20-20 Regel Reminder (alle 20 Min, 20 Sek, 20 Fuß entfernt schauen). Bildschirmzeit-Logging. Augenübungen (Fokus nah/fern, Kreise, Palming). Synergie: `stretch` (Desk-Break könnte Augenübung enthalten).

## Knowledge & Productivity (additional)

- **readlog** — Lese-Fortschritt tracken (Seiten/Tag, aktuelles Kapitel). Leichter als `library`, fokussiert auf Dranbleiben.
- **snippets** — Code-Schnipsel-Bibliothek mit Syntax-Highlighting, Tags, Suche.
- **flashbacks** — "On this day"-Aggregator über alle Module. Journal, Fotos, Moods, Todos von vor 1/2/5 Jahren.
- **teach** — Feynman-Methode: Konzepte in eigenen Worten erklären, Lücken erkennen. Verknüpft mit `cards` und `skilltree`.

## Alltag & Organisation (additional)

- **routines** — Morgen-/Abend-Routinen als geordnete Checklisten mit Timer pro Schritt. Ergänzt `habits`.
- **documents** *(ZK)* — Persönliches Dokumenten-Management: Pass, Ausweis, Versicherungen, Verträge. Ablaufdaten mit Erinnerungen.
- **addresses** — Adressen-Sammlung über `contacts` hinaus: Ärzte, Handwerker, Restaurants mit Bewertungen.

## Social & Fun (additional)

- **challenges** — Gemeinsame Challenges mit Freunden (30 Tage Sport, Bücher lesen). Leaderboard, Beweise per Foto.
- **mixtapes** — Kuratierte Playlists/Musikempfehlungen für Freunde, verknüpft mit `music`.

## Meta & System

- **dashboard** — Konfigurierbares Dashboard mit Widgets aus allen Modulen. Tages-Überblick: Wetter, Termine, Habits, Mood, Todos.
- **review** — Wöchentliche/monatliche/jährliche Reviews: automatisch Daten aus allen Modulen aggregieren, Trends zeigen, Reflexionsfragen.
- **export** — Daten-Export pro Modul (JSON, CSV, PDF). DSGVO-konform, "deine Daten gehören dir".
- **integrations** — Webhook/API-Anbindungen für externe Dienste (Spotify, Strava, Toggl). Feeds Daten in bestehende Module.

---

## Next steps

When picking one to build, the standard scaffolding is:

1. `apps/mana/apps/web/src/lib/modules/{name}/module.config.ts` — declare `appId` + tables
2. Add to `apps/mana/apps/web/src/lib/data/module-registry.ts`
3. Add Dexie schema bump in `apps/mana/apps/web/src/lib/data/database.ts`
4. If sensitive: register in `apps/mana/apps/web/src/lib/data/crypto/registry.ts`
5. Route under `apps/mana/apps/web/src/routes/(app)/{name}/`
6. Register in `packages/shared-branding/src/mana-apps.ts` (icon, tier, branding)
