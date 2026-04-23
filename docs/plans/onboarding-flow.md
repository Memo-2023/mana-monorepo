# Onboarding Flow

**Status:** proposed
**Scope:** UX + auth + workbench data-layer
**Owner:** till
**Created:** 2026-04-23

## Problem

Mana launcht bald mit 27+ Modulen in einer einzigen App. Ein Erstnutzer
landet heute nach Signup auf `/welcome` (localStorage-Flag
`HAS_SEEN_WELCOME`), sieht eine generische Intro, und wird dann in eine
hart kodierte Home-Scene mit `todo/calendar/notes` fallen gelassen.

Effekte:

- Nichts fragt, **wer** der Nutzer ist — jede Greeting bleibt anonym.
- Nichts fragt, **was** er mit Mana tun will — wer für Fitness-Tracking
  kam, sieht Work-Defaults und bounct; wer für Journaling kam, findet
  das Modul nur über die Gallery.
- Nichts macht die App visuell „seins" — die 8 vorhandenen
  Theme-Varianten sind ein starkes Differenzierungs-Feature, das erst
  in Settings zu finden ist.

## Goals

- **3-Screen-Onboarding** nach Signup: Name → Look → Templates.
- `displayName` dauerhaft in mana-auth persistieren, damit UI und
  Sync-Jobs einen Handle haben.
- Nutzer wählt ein Theme aus den 8 vorhandenen Varianten als erstes
  „make it yours"-Moment.
- Nutzer wählt 1+ Use-Case-Templates (Health, Lernen, Sport, Entdecken,
  Erinnern, Alltag); deren Union bestimmt, welche Module als Cards in
  der Default-Home-Scene gepinnt werden.
- Jederzeit überspringbar (pro Screen + „alles überspringen"), mit
  sinnvollen Fallbacks.

## Non-goals

- **Kein Space-Type-Picker im Flow.** Nutzer starten im automatisch
  angelegten Personal-Space; Family/Team/Brand/Club/Practice bleiben
  hinter dem existierenden Space-Creation-Flow — v2-Thema.
- **Kein Avatar-Upload.** Me-Images hat seinen eigenen Flow
  (`/profile/me-images`) und würde das Onboarding sprengen.
- **Kein Per-Modul-Onboarding.** Module wie `news` haben eigene
  `onboardingCompleted`-Flags und bleiben orthogonal.
- **Keine dynamische/LLM-generierte Template-Empfehlung** in v1 —
  statischer Katalog ist inspectable, testbar, in einer Woche shipbar.

## Current state

- **Signup → `/welcome`** (`apps/mana/apps/web/src/routes/welcome/+page.svelte:19`).
  `HAS_SEEN_WELCOME` im localStorage: client-only, nicht cross-device,
  nicht auto-disabled nach einmaligem Sehen.
- **AuthUser-Shape**: Better-Auth nutzt `user.name` (nicht
  `displayName`) als primäres Feld (`services/mana-auth/src/db/schema/auth.ts:40`);
  Client-side `UserData.name` (`packages/shared-auth/src/types/index.ts:75`)
  spiegelt das wider, ist aber optional weil nicht jeder Flow ihn
  gesetzt hat.
- **SpaceTypes**: `personal | brand | club | family | team | practice`
  (`packages/shared-types/src/spaces.ts:29`). Personal-Space wird via
  Sentinel `_personal:<userId>` automatisch angelegt
  (`apps/mana/apps/web/src/lib/data/scope/bootstrap.ts:24`).
- **Theme-Store**:
  `createThemeStore({appId:'mana', defaultVariant:'ocean'})`
  (`apps/mana/apps/web/src/lib/stores/theme.ts:18`). 8 Varianten:
  `lume | nature | stone | ocean | sunset | midnight | rose | lavender`.
  Settings synced über `GlobalSettings.theme` mit `mana-auth`.
- **Home-Scene-Default**: hart kodiert
  (`apps/mana/apps/web/src/lib/stores/workbench-scenes.svelte.ts:47`):
  ```ts
  const DEFAULT_HOME_APPS = [{appId:'todo'},{appId:'calendar'},{appId:'notes'}];
  ```
- **`workbenchScenesStore.createScene()`** existiert schon und ist
  deterministisch genug, um aus dem Onboarding heraus eine
  alternative Start-Scene zu schreiben.
- **App-Registry**:
  `apps/mana/apps/web/src/lib/app-registry/apps.ts` +
  `packages/shared-branding/src/mana-apps.ts` halten 27+ Module mit
  Icons, Tiers und Kurzbeschreibungen.

## Design

### Flow

```
signUp → /onboarding/name → /onboarding/look → /onboarding/templates → /
```

Route-Guard im Root-Layout: authentifizierter User + `onboardingCompletedAt === null`
→ redirect auf `/onboarding/name`, **außer** man ist bereits auf einer
`/onboarding/*`-Route.

### Screen 1 — Name

- **Headline**: „Wie willst du genannt werden?"
- Text-Input (1–40 chars, trim), Placeholder greifbar („z. B. Till")
- „Weiter"-Button disabled bei leerem Wert
- „Überspringen" oben rechts → fallback `name = email.split('@')[0]`
- Submit: POST `mana-auth` → aktualisiert Better-Auth `user.name` (z. B.
  über `authClient.updateUser({ name })` oder einen eigenen Endpoint)
- Keep simple: Enter = Weiter

### Screen 2 — Look

- **Headline**: „Hi {displayName}, wähle deinen Look"
- 8 Theme-Tiles mit Live-Preview (Mini-Workbench-Stack in dem Variant)
- Oben: Mode-Toggle `Hell | Dunkel | System` als separate Row
- Single-Select, Klick setzt direkt:
  - `theme.setVariant(variant)` (live, lokal)
  - `userSettings.updateGlobal({ theme: { mode, colorScheme } })` (persistent)
- „Weiter" immer aktiv (Default vorselektiert: aktueller Wert oder `ocean`)

### Screen 3 — Templates

- **Headline**: „Wofür willst du Mana nutzen?"
- 7 Tiles (Multi-Select, Icon + Name + 1-Liner):

  | Template       | Module-Vorschlag (Reihenfolge = Priorität)                    |
  |----------------|---------------------------------------------------------------|
  | **Alltag**     | `todo`, `calendar`, `notes`, `contacts`                       |
  | **Arbeit**     | `todo`, `calendar`, `mail`, `chat`, `times`, `notes`          |
  | **Health**     | `habits`, `body`, `mood`, `food`, `period`                    |
  | **Sport**      | `habits`, `body`, `food`, `goals`, `stretch`                  |
  | **Lernen**     | `skilltree`, `quiz`, `notes`, `library`, `kontext`            |
  | **Entdecken**  | `places`, `citycorners`, `photos`, `music`, `wetter`          |
  | **Erinnern**   | `memoro`, `journal`, `photos`, `moodlit`, `quotes`            |

  Alle Modul-IDs gegen `apps/mana/apps/web/src/lib/app-registry/apps.ts`
  verifiziert (2026-04-23). Dedup über Templates hinweg passiert im
  Finish-Handler; Prioritäts-Reihenfolge bleibt erhalten.

- „Fertig"-Button:
  1. Union der `moduleIds` deduplicaten, Reihenfolge = erstes
     Vorkommen in Template-Priorität
  2. Cap bei **8 Modulen** (2×4 Grid) — Rest bleibt über „App
     hinzufügen" erreichbar
  3. `workbenchScenesStore.createScene({ name: 'Zuhause', apps })` —
     überschreibt `DEFAULT_HOME_APPS` für diesen User
  4. PATCH `onboardingCompletedAt = now()`
  5. Redirect `/`
- „Überspringen": Scene wird **nicht** erstellt; fällt zurück auf
  `DEFAULT_HOME_APPS`. `onboardingCompletedAt` wird **trotzdem**
  gesetzt (sonst Flow-Schleife).

### Data changes

**mana-auth**: neues Feld `onboardingCompletedAt: Date | null` auf
`auth.users`-Tabelle (nullable, default null). Kein Backfill nötig —
Launch ohne bestehende Nutzer.

Migration: einfache Drizzle-Schema-Erweiterung. `pnpm --filter @mana/auth
db:push` wendet den Column-Add an, keine hand-authored SQL nötig.

**Read-Path**: dedizierter Endpoint
`GET /api/v1/me/onboarding → { completedAt: Date | null }` statt JWT-
Claim, damit wir nach `POST /complete` nicht den Token neu minten
müssen. Client-seitiger Store lädt bei Auth-Ready einmalig.

**Write-Path**:
- `POST /api/v1/me/onboarding/complete` → setzt `onboardingCompletedAt = now()`,
  idempotent (kein Update wenn bereits gesetzt)
- `PATCH /api/v1/me/onboarding/reset` → setzt auf `null`, für das
  Settings-Re-Trigger in M5

**Shared-branding**: neue Datei
`packages/shared-branding/src/onboarding-templates.ts`:

```ts
export type OnboardingTemplateId = 'alltag' | 'arbeit' | 'health' | 'sport' | 'lernen' | 'entdecken' | 'erinnern';

export type OnboardingTemplate = {
	id: OnboardingTemplateId;
	name: string;              // DE
	shortDescription: string;  // 1-Liner
	icon: IconName;            // aus @mana/shared-icons
	moduleIds: string[];       // max 5, Reihenfolge = Priorität
};

export const ONBOARDING_TEMPLATES: readonly OnboardingTemplate[] = [...];
```

Warum `shared-branding`, nicht webapp-lokal: die Template-Definition
ist Branding/Produkt-Entscheidung, nicht UI-Logik — memoro (mobile)
kann sie später mit-konsumieren.

### Route-Struktur

```
apps/mana/apps/web/src/routes/onboarding/
├── +layout.svelte         # Progress-Dots (3), „alles überspringen"
├── +layout.ts             # Guard: onboardingCompletedAt gesetzt → redirect /
├── name/+page.svelte
├── look/+page.svelte
└── templates/+page.svelte
```

### Reuse, don't rebuild

- **Theme-Picker**: Die Tiles aus `/themes` extrahieren in
  `ThemeSelector.svelte`, in beiden Screens mounten.
- **Module-Tiles** nutzen `APP_ICONS` aus
  `packages/shared-branding/src/app-icons.ts` + `mana-apps.ts` für
  Namen/Beschreibung — kein Duplikat.
- **Scene-Creation** nutzt `workbenchScenesStore.createScene()` — kein
  neues Data-Layer-Primitiv.
- **Settings-Sync**: `userSettings.updateGlobal()` existiert schon und
  synct über mana-auth.

## Implementation steps

**M1 — Data model + Backend + Client-Store** (~1 Tag)
- Drizzle: `onboardingCompletedAt` column auf `auth.users`
- Endpoints: GET/POST/PATCH unter `/api/v1/me/onboarding/*`
- Client-Store: `$lib/stores/onboarding-status.svelte.ts` mit
  `load()`/`markComplete()`/`reset()`
- **Kein Route-Guard, kein UI** — Plumbing only, kann ohne
  Feature-Flag mergen. Guard kommt in M2 wenn Screens existieren
  (sonst würde Redirect auf 404 zeigen).

**M2 — Route-Guard + Shell + Screen 1 (Name)** (~0.5 Tag)
- Guard in `(app)/+layout.svelte` → `goto('/onboarding/name')` wenn
  `onboardingStatus.completedAt === null` und Pfad nicht schon
  `/onboarding/*`
- `/onboarding/+layout.svelte` mit Progress-Dots + Skip-All, Haupt-
  Chrome (PillNav/Bottom-Stack) ausblenden für clean UI
- `/onboarding/name/+page.svelte` + `authClient.updateUser({ name })`
- E2E: Signup → Name-Screen → Weiter → `/onboarding/look`

**M3 — Screen 2 (Look)** (~0.5 Tag)
- `ThemeSelector.svelte` aus `/themes` extrahieren
- `/onboarding/look/+page.svelte`, Persistenz via
  `userSettings.updateGlobal({theme})`
- E2E: Theme-Klick → CSS-Variablen wechseln live → reload → Theme bleibt

**M4 — Templates + Screen 3** (~1 Tag)
- `ONBOARDING_TEMPLATES` definieren, Modul-IDs gegen Registry
  verifizieren (siehe Open Question 1)
- `/onboarding/templates/+page.svelte` mit Multi-Select-Tiles
- Finish-Handler: dedupliziertes Modul-Set → `createScene()`,
  `onboardingCompletedAt = now()`, Redirect `/`
- E2E: Health + Sport picken → Home-Scene enthält
  `habits, body, food, mood, period, goals` (dedupliziert, max 8)

**M5 — Polish + Re-Trigger** (~0.5 Tag)
- Settings → Account → „Onboarding erneut durchlaufen" setzt
  `onboardingCompletedAt = null`
- `/welcome`-Seite: weiter als Marketing-Landing behalten **oder**
  deprecaten (TBD, offene Frage)
- Analytics-Events: `onboarding_screen_viewed`,
  `onboarding_template_picked`, `onboarding_completed`,
  `onboarding_skipped_at_{name|look|templates}`

**Total: ~3.5 Tage** bei realistischer Schätzung. Parallelisierbar zu
zweit auf ~2 Tage (M1 einer, M2+M3 parallel, M4 sobald M1 durch).

## Tradeoffs

- **3 Screens ist am oberen Ende.** Jeder Screen ist ein Drop-off-Risk.
  Kompensiert durch Skip pro Screen + Defaults. Schnellster Path ist
  3× Enter.
- **Multi-Select vs. Exklusiv** bei Templates: Multi-Select gewinnt,
  weil Health+Sport oder Lernen+Alltag echte reale Kombis sind.
  Dedup ist billig, keine UX-Kosten.
- **Statisch vs. LLM-generiert**: Statisch ist inspectable, testbar,
  Fehler-armer erster Eindruck. LLM-Variante ist v2.
- **Theme in Onboarding vs. Settings-only**: Risiko, dass Nutzer
  overwhelmed sind von 8 Varianten bei Signup. Mitigation: ein
  sinnvolles Default (`ocean`) ist vorselektiert, „Weiter" ohne Klick
  ist OK.
- **Templates in `shared-branding`**: minimaler Lock-in für memoro
  (mobile). Alternative: web-lokal bis jemand mobile-Onboarding baut.
  `shared-branding` gewinnt — Definition ist Produkt, nicht UI.
- **Route-Guard im Root-Layout vs. Hook in jedem Module**: Root-Layout
  zentralisiert Redirect-Logik, eine Stelle zum Ändern. Hook pro
  Modul wäre defensiver, aber N-mal Duplicate. Root gewinnt.

## Rollout

- Feature-Flag `ONBOARDING_V1_ENABLED` (default off in prod)
- M1–M4 Bundle mergen, dann Flag auf Staging flippen, smoketesten
- Bestehende User sind durch Backfill geschützt — nur Neu-Signups
  nach Flag-on sehen den Flow
- Drop-off-Monitoring pro Screen; falls > 30% an einer Stelle →
  Screen-Inhalt kürzen oder Skip prominenter machen
- Settings-Re-Trigger (M5) lässt Early-Adopter freiwillig durchlaufen
- Live-Flip nach ~3 Tagen Staging-Soak ohne kritische Findings

## Resolved decisions (2026-04-23)

- **Modul-IDs verifiziert** gegen `apps.ts`. Alle 29 in Templates
  referenzierten IDs existieren: `todo, calendar, notes, contacts,
  mail, chat, times, habits, body, mood, food, period, goals, stretch,
  skilltree, quiz, library, kontext, places, citycorners, photos,
  music, wetter, memoro, journal, moodlit, quotes`.
- **„Arbeit" als eigenes Template** aufgenommen (7 Templates total).
  Überlappung mit „Alltag" (todo/calendar/notes) ist gewollt und wird
  dedupliziert — „Arbeit" ergänzt Mail/Chat/Times, „Alltag" ergänzt
  Contacts.
- **Kein Tier-Gating im Onboarding.** Templates zeigen alle Module
  unabhängig von `requiredTier`. Wenn Production-Tiers reaktiviert
  werden, greift das normale `AuthGate` beim Öffnen — das Modul-Tile
  zeigt sich, nur das Öffnen führt ggf. zu Upgrade-Prompt. Bewusste
  Entscheidung, Discovery nicht zu gaten.
- **Max-Module-Cap bleibt bei 8** (2×4 Grid). Bei 7 gewählten
  Templates mit Dedup landen ~25 Unique-Module im Pool — die ersten
  8 nach Template-Prioritäts-Reihenfolge gewinnen, Rest über „App
  hinzufügen" erreichbar.

## Still open

1. **Welcome-Page behalten oder löschen?** Als Marketing-Landing für
   Logged-out-Pre-Signup könnte sie bleiben. Entscheidung in M5.
2. **Mobile (memoro)?** Onboarding ist v1 web-only; memoro könnte
   `onboardingCompletedAt` + Templates künftig mit-konsumieren. Nicht
   blockierend.
3. **Default-Mode Hell/Dunkel/System?** Aktueller Default ist unklar —
   muss ich mit dem aktuellen Verhalten von `createThemeStore`
   abgleichen, bevor Screen 2 fest verdrahtet ist. Wird in M3 geklärt
   (ein-Zeiler-Lookup).
