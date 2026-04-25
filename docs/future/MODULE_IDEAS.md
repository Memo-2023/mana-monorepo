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

## 2026-04-25 Brainstorm — Mana-spezifische Ideen

Ideen, die bewusst auf das einzigartige Stack-Profil von Mana setzen:
Personas, MCP-Tools, Spaces, Visibility/Embed, Local-First, Verschlüsselung.
Keiner dieser Vorschläge existiert in den 82 aktuellen Modulen oder weiter
unten in dieser Datei.

### KI-native (Personas, Missions, MCP)

- **debate** — Zwei Personas argumentieren live einen Streitpunkt aus deinem Prompt. Du votest pro Runde; Output = strukturierte Pro/Contra-Liste.
- **rubberduck** — Sprich-laut-denken: Mic an → STT → AI strukturiert "Du hast erst X gesagt, dann Y, Kerngedanke = Z". Verknüpft mit `notes`/`decisions`.
- **dialogues** — Schwierige Gespräche üben (Gehaltsverhandlung, Trennung, Eltern, Bewerbungsinterview). Persona spielt Gegenüber + Feedback zu Tonfall/Struktur.
- **scribe** — Live-Notetaker für In-Person-Meetings: Mic offen, transcribed + strukturiert in Echtzeit (Action-Items → `todo`, Zitate → `quotes`).
- **pitch** — 30-Sek-Pitch aufnehmen, AI bewertet Hook/Klarheit/Lieferung. Versionsverlauf.
- **clones** *(ZK)* — Persona, trainiert auf Gespräche/Texte einer realen Person (du selbst, Freund, verstorbener Großvater). Chat & Briefe — heikel, klar als Roleplay markiert.
- **ai-pets** — Persistenter AI-Charakter (Tamagotchi-Logik): füttern, sprechen, wächst über Wochen. Kinder-Modul-Kandidat.
- **prompts** — Prompt-Bibliothek mit Variablen, Versionen, eingefangenen Outputs. Mana-Twist: gespeicherte Prompts werden automatisch zu MCP-Tools.

### Zeit, Erinnerung, Identität

- **eras** — Selbst-betitelte Lebensabschnitte ("Burnout-Jahr 2024", "Berlin-Phase"). Aggregiert *alles* aus dem Zeitraum (Fotos, Journal, Mood, Todos) zu einer Wikipedia-artigen Seite — AI-generiert, kuratierbar.
- **threads** — Mehrjährige Themen-Threads (Beziehung zur Schwester, dieses Side-Projekt, diese Angst). Tagged Einträge, AI fasst Bogen zusammen.
- **lasts** — Gegenstück zu `firsts`: das *letzte* Mal, dass du X getan/gesehen/gefühlt hast. Oft erst rückwirkend erkennbar — push notification "vor X Jahren das letzte Mal …".
- **legacy** *(ZK)* — Was du hinterlassen willst: digitales Testament, Briefe an Hinterbliebene, Memorial-Botschaften (zeitgesperrt freischaltbar — wie `letters` aber outward).
- **sealed** — Vorhersagen verschlossen ablegen, automatisches Reveal am Datum X. Kalibrierungs-Tracking (Brier-Score) — persönliche Tetlock-Statistik.
- **regret / forgive** *(ZK)* — Bedauern / Vergeben; CBT-light Workflow: erfassen → reframen → loslassen-markieren.

### Sensorik & Welt

- **sounds** — Field-Recordings-Bibliothek (Regen in Tokyo, Vogelchor auf Wanderung). Geo+Zeit-getaggt; Spotlight für `flashbacks`.
- **scents** — Parfums, Kerzen, Räucherstäbchen — was du wann getragen hast. "Geruchsgedächtnis"-Notizen.
- **tastes** — Verkostungs-Notizen (Wein, Whisky, Spezialitätenkaffee, Tee). Vivino-artig aber generisch und verschlüsselt.
- **palette** — Farben, die du an einem Tag siehst — Foto, AI extrahiert Hauptfarben → Jahres-Farbgeschichte.
- **light** — Tageslicht-Exposition (manuell oder Wetter-API). Korreliert mit `moodlit`/`sleep`.

### Bewegung & Orte (jenseits von `places`)

- **routes** — Lauf/Rad/Wander-Routen, die du gemacht hast. Map-View, Wiederholungs-Counter.
- **hikes** — Wander-Log: Distanz, Höhenmeter, Gipfel, Foto-Sammlung. Reused `places` + `photos`.
- **borders** — Länder/Grenzen, die du überschritten hast. Visa, Stempel-Foto, Erinnerungen pro Übergang.
- **landmarks** — *Persönliche* Landmarks: wo du verlobt warst, erstes Date-Café, wo du den Anruf bekamst. Geo-pinned, oft (ZK).

### Selbsterkenntnis & Muster

- **triggers** — Was dich getriggert hat (Wut/Angst/Scham). AI-Mustererkennung über Wochen.
- **rules** — Persönliche Operating-Rules ("Kein Handy vor Kaffee", "Sonntags kein Slack"). Adhärenz-Tracking, schlägt Edits vor wenn dauerhaft gebrochen.
- **anti-todos** — Was du *bewusst nicht* tust und warum. Mindestens so wertvoll wie eine Todo-Liste.
- **delegations** — Was du an wen delegiert hast — privat *und* beruflich. Auto-Follow-up.
- **ifsthen** — Implementation Intentions ("Wenn Mittwoch 20h, dann Klettern"). Spätere Auswertung: welche Pläne hielten?
- **superpowers** — Konkrete Stärken mit echten Beispielen. AI hilft Muster zu finden ("du wirst oft als 'klar' beschrieben").
- **cravings** — Triebmomente erfassen (Junkfood, Scrollen, Rauchen). Pattern + Redirect-Vorschlag.

### Geld erweitert

- **donations** — Spenden-Log mit Steuerexport.
- **patrons** — Creator, die du unterstützt (Patreon, Substack, GitHub-Sponsors). Budget-Sicht, Renewal-Daten.
- **negotiations** — Was du verhandelt hast: Ask vs. Result. Übungs-Datenbank für nächste Runde.
- **freebies** — Was du geschenkt/gratis bekommen hast. Erstaunlich motivierend; gut für Steuer wenn beruflich.

### Kreativ & Werk

- **drafts** — Universaler Entwurfs-Inbox (Texte, Mails, Posts, Tweets). Kein Modul-Zwang; AI schlägt Ziel-Modul vor.
- **publishings** — Alles, was du veröffentlicht hast (Blog, Tweet, Vortrag, Podcast). Wo, wann, Reaktionen — eine Karriere-Timeline.
- **shows** — Konzerte, Ausstellungen, Filme, Theater die du besucht hast. Tickets-Archiv (Foto), Begleitung, Gedanken danach.
- **tickets** — Stub-Sammlung: Konzert/Sport/Kino. Foto + OCR + Erinnerung. Stark als Embed (Visibility).
- **portfolios** — Public-facing kuratierte Werk-Sammlung (zieht aus `picture`, `writing`, `comic`, `presi`). Visibility-System pur.

### Affirmation & Mentalmodelle

- **mantras** — Persönliche Mantras + Frequenz-Tracking ("dieses Mantra benutze ich tatsächlich").
- **lessons** — Lebenslektionen. Tagged nach Domäne, jährliche Review.
- **wins** — Mikro-Wins täglich (kleiner als `goals`, kein Streak-Druck).
- **fears** — Furcht-Inventar mit Status (aktiv/abgeschlossen/transformiert).
- **losses** *(ZK)* — Trauer-Journal pro Person/Sache. Anniversary-Reminder, AI-Begleitung optional.

### Bürgerlich / Welt

- **votes** — Wahl-Historie + Wahlzettel-Recherche-Notizen + lokale Repräsentanten.
- **causes** — Themen, die dir wichtig sind. Aktionen (Demo, Spende, Brief), Updates pro Cause.
- **rights** — Mieter-/Arbeitsrechte als Situations-Checkliste ("Vermieter sagt X — was sind meine Rechte?"). MCP-Tool wäre sinnvoll.

### Häuslich (Detail)

- **moves** — Alle Umzüge: was verschwand, was du wegspendetest, was blieb. Ergänzt `inventory`.
- **roomies** — WG-Mitbewohner-Log; Konflikte/Vereinbarungen.
- **handymen** — Handwerker, Ärzte, Service-Provider mit echten Bewertungen. Privater "lokaler Yelp".
- **insurance** — Policies, Schäden, Beitragshistorie. Synergie mit `documents`.

### Sozial fein granular

- **handshakes** — Bemerkenswerte Menschen, die du getroffen hast. Eine-Zeile-Erinnerung pro Person.
- **mentors / mentees** — Wer dir half / wem du halfst. Konkrete Momente.
- **rolemodels** — Public Figures, von denen du lernst. Was genau, und warum.
- **names** — Wie spricht/schreibt man Namen? Eselsbrücken pro Person.

### Verspielt

- **bets** — Wetten mit Freunden. Multi-Member Space als Wettregister; wer hatte recht?
- **wagers** — Selbst-Wetten an Goals geknüpft ("Wenn ich Marathon nicht laufe → 200€ Spende").
- **prophecies** — Vorhersagen, die du *öffentlich* gemacht hast (Tweets, Diskussionen). Realitäts-Check Quartal.
- **fortunes** — Glückskekse, Horoskope, Tarot. Realitäts-Abgleich — Pseudo-Weisheit-Inventur.

### Notfall & Sorge

- **emergency** *(ZK)* — Notfall-Kontakte, Allergien, Blutgruppe, Ärzte. Schnellzugriff am Sperrbildschirm wäre Killer.
- **caregiving** *(ZK)* — Pflege für Eltern: Medikamente, Termine, Episoden. Mehrere Familienmitglieder via Spaces.
- **proxy** *(ZK)* — Vorsorgevollmacht, Patientenverfügung, digitale Erbschaft.

### Pro-Tooling

- **tools** — Werkzeuge-Inventar (Holz, Code, Küche). Was hast du womit gebaut?
- **rigs** — Compute-Setups über Zeit (welche Maschine, welche dotfiles, was hast du damit gebaut). Nostalgie + Migration.
- **commands** — CLI-Commands die du *wirklich* benutzt. Aliase mit Kontext.

### Phänomenologisch (mutig)

- **synchronicities** — Zufälle/Synchronizitäten erfassen. AI sucht Muster — wahrscheinlich keine, aber spannend.
- **dejavu** — Déjà-vu-Episoden mit Auslöser. Häufungs-Heatmap.
- **omens** — Was hast du als Zeichen genommen? Was passierte tatsächlich? Aberglaubens-Auditor.

### Top-7 zum Bauen (höchster Hebel auf bestehende Architektur)

1. **scribe** — riesiger Wert, perfekter Fit für mana-stt + Personas
2. **eras** — emotional starke Killer-Feature, zieht aus *allen* Modulen
3. **lasts** — billig zu bauen, einzigartiges Gefühl (existiert nirgends)
4. **rubberduck** — STT + AI Reflection, organisch zu `decisions`/`notes`
5. **emergency** *(ZK)* — echtes Lebens-Utility, schwacher Markt
6. **sealed** — eingebaute Kalibrierung, gamified Selbsterkenntnis
7. **portfolios** — testet Visibility-System unter Last, 0 neue Datentabellen

---

## Current modules (for reference)

**Productivity:** todo, calendar, contacts, notes, habits, times, timeblocks, events
**Knowledge & learning:** cards, quotes, guides, questions, skilltree, memoro, context
**Health & self:** food, period, dreams, moodlit, plants
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

- **recipes** — Recipes (linked to `food`), meal plan, shopping list generator
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

- **drink** — ✅ **Built.** Getränke-Tracker für alle Getränke (Wasser, Kaffee, Tee, Saft, Alkohol etc.). Tages-/Wochenziele, Favoriten, Verlauf. Verknüpfung mit `food` und `body`.
- **stretch** — ✅ **Built.** Geführtes Dehnen mit Timer-Player, Bestandsaufnahme, Routinen, Streaks, Erinnerungen. 22 Seed-Übungen, 5 Preset-Routinen.
- **breathe** — Atemübungen & Meditation-Timer mit geführten Mustern (Box Breathing, 4-7-8). Sessions-Log verknüpft mit `moodlit`.
- **fasting** — Intervallfasten-Timer (16:8, 18:6, OMAD, custom). Essensfenster visualisieren, Fasten-Streak. Synergie: `food` (Mahlzeiten im Essensfenster), `drink` (Wasser während Fastenphase).
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
