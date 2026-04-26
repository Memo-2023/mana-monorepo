---
status: draft
owner: till
created: 2026-04-26
---

# `@mana/feedback` als zentraler Feedback-Hub

> Alle nutzergenerierten Rückmeldungen — Bug-Reports, Feature-Wünsche, Lob,
> Onboarding-Wünsche, NPS, Churn-Gründe — landen in einem System: dem
> `user_feedback`-Table im `mana-analytics`-Service, getypt über das
> `@mana/feedback`-Package. Ein Schema, ein API-Surface, ein Admin-Hub.

---

## Ist-Zustand (2026-04-26)

- **Package** `packages/feedback/` exportiert Typen, einen Service-Factory
  (`createFeedbackService`), und UI-Komponenten (`FeedbackPage`,
  `FeedbackForm`, `FeedbackList`, `VoteButton`, `StatusBadge`).
- **Server** `services/mana-analytics` (Port 3064): Postgres-Schema
  `feedback`, Tabellen `user_feedback` + `feedback_votes`, REST-Endpoints
  unter `/api/v1/feedback/*`. Auto-Title via `mana-llm` beim Submit.
- **Web-App** Singleton in `apps/mana/apps/web/src/lib/api/feedback.ts`,
  Modul-View in `apps/mana/apps/web/src/lib/modules/feedback/ListView.svelte`,
  Route `/feedback`. Voting + Public-Liste sind voll verdrahtet.
- **Drift**, die fixen müssen, bevor wir mehr draufpacken:
  | Bereich  | Package                                    | DB                                   |
  |----------|--------------------------------------------|--------------------------------------|
  | Status   | `submitted/under_review/.../completed/declined` | `new/reviewed/.../done/rejected`     |
  | Category | `bug/feature/improvement/question/other`   | + `praise` (zusätzlich)              |
  | Default  | `submitted` (impliziert)                   | `new`                                |
  Konsequenz: Client typisiert Status als `'submitted'`, kriegt aber
  `'new'` zurück → `FEEDBACK_STATUS_CONFIG[status]` ist `undefined` →
  StatusBadge rendert leise nichts. Niemand fällt's auf weil keine
  Admin-UI Status setzt und alle Records auf Default sitzen.
- **Fundamentale Annahmen, die wir nicht ändern:**
  - Server-only Persistence (kein Dexie / Local-First, kein mana-sync).
    Submit ist ein einziger POST, fail-soft.
  - Feedback ist **nicht** im Mana-Crypto-Pfad — Klartext im DB.
    OK für Bug-Reports & Wünsche; sensible Daten gehören eh nicht hier rein.

---

## Phase 0 — Drift fixen *(Refactor, ein Commit)*

Ziel: Package + DB konsistent, Defaults sauber, keine Funktions-Erweiterung.

### 0a. Status-Enum: Package gewinnt

PostgreSQL kann seit 10 `ALTER TYPE ... RENAME VALUE`, das ist non-destructive
und behält die Sortierung der Enum-Werte. Wir benennen die DB-Werte um, sodass
sie zum Package passen:

```sql
ALTER TYPE feedback.feedback_status RENAME VALUE 'new'      TO 'submitted';
ALTER TYPE feedback.feedback_status RENAME VALUE 'reviewed' TO 'under_review';
ALTER TYPE feedback.feedback_status RENAME VALUE 'done'     TO 'completed';
ALTER TYPE feedback.feedback_status RENAME VALUE 'rejected' TO 'declined';
ALTER TABLE feedback.user_feedback ALTER COLUMN status SET DEFAULT 'submitted';
```

Drizzle-Schema (`services/mana-analytics/src/db/schema/feedback.ts`) parallel
auf die neuen Werte ziehen, sodass `db:push` nicht versucht, neu anzulegen.

### 0b. Category 'praise' ins Package aufnehmen

Package hat `bug/feature/improvement/question/other`. DB hat `praise`
zusätzlich. Wir nehmen `'praise'` ins Package mit Label "Lob" und
behalten DB unverändert.

### 0c. Single Source of Truth

Mana-analytics importiert die Enum-Werte ab jetzt aus `@mana/feedback`
statt eigenes `pgEnum`-Array zu pflegen. Verhindert künftige Drift
strukturell. (Falls drizzle-kit das nicht direkt kann, dann mindestens
ein Test in `services/mana-analytics` der die Listen vergleicht.)

### Migrations-Workflow

mana-analytics benutzt aktuell `drizzle-kit push` (kein
Migrations-Verzeichnis). Für `ALTER TYPE RENAME VALUE` ist push nicht
zuverlässig — das ist ein hand-authored SQL-Step.

→ Neue Datei `services/mana-analytics/drizzle/0001_align-feedback-enums.sql`
einführen, in Setup-README dokumentieren ("apply manually before db:push").
Pattern wie `apps/api/drizzle/{schema}/*.sql`.

---

## Phase 1 — Onboarding-Wish *(Feature, ein Commit)*

Ziel: Letzter Onboarding-Schritt ist Freitext-Frage "Was wünschst du dir
von Mana?", deren Antwort als `@mana/feedback`-Record landet.

### 1a. Neue Category `'onboarding-wish'`

```sql
ALTER TYPE feedback.feedback_category ADD VALUE IF NOT EXISTS 'onboarding-wish';
```

Im Package:
- `FeedbackCategory` um `'onboarding-wish'` erweitern
- `FEEDBACK_CATEGORY_LABELS['onboarding-wish'] = 'Was ich mir wünsche'`

### 1b. Onboarding-Flow-Store erweitern

`apps/mana/apps/web/src/lib/stores/onboarding-flow.svelte.ts`:
- `pendingWish: string | null`
- `setPendingWish(value)` / `reset()` mit dabei

### 1c. Layout: 3 → 4 Step-Dots

`apps/mana/apps/web/src/routes/(app)/onboarding/+layout.svelte`:
- `currentStep`-Mapping: `/onboarding/wish` → 3
- Dots-Array `[0,1,2,3]`
- aria-valuemax = 4

### 1d. Neuer Screen `/onboarding/wish/+page.svelte`

- **Aktivierungstext:**
  > # Eine letzte Sache
  > Was wünschst du dir von Mana? Wofür willst du's nutzen, was erhoffst du dir?
  >
  > Schreib einfach, wie's dir kommt — wir lesen jede Antwort und sie
  > hilft uns, Mana für dich besser zu machen.
- **Textarea**: `maxlength=2000`, autofocus, `auto-grow`
- **Buttons**: Zurück (→ `/onboarding/templates`) + Fertig
- **Submit-Logik** (Fertig):
  1. Wenn Textarea nicht leer → `feedbackService.createFeedback({
     category: 'onboarding-wish', isPublic: false, feedbackText: trimmed })`
     **fail-soft** (`try/catch`, nur `console.warn`, kein UI-Block)
  2. `onboardingStatus.markComplete()`
  3. `onboardingFlow.reset()`
  4. `goto('/')`
- **Wenn Textarea leer + Fertig**: gleicher Flow ohne Submit.
- **isPublic = false** by default, weil Wünsche persönliche Statements sind,
  kein Public-Voting-Material. (Lässt sich später per Admin-Action publishen.)

### 1e. Templates-Screen umbiegen

`apps/mana/apps/web/src/routes/(app)/onboarding/templates/+page.svelte`:
- Fertig-Button heißt jetzt "Weiter" und routet `goto('/onboarding/wish')`
- `markComplete` + `reset` wandern raus aus templates → in den wish-Screen
- Templates-Save (createScene) bleibt wie er ist

### Akzeptanzkriterien

- 4 Step-Dots im Footer; bei `/onboarding/wish` ist Dot 4 aktiv
- Globaler Skip-Button (unten links) funktioniert auf allen 4 Screens
  (markComplete + `/`)
- Submit von "Was wünschst du dir" landet als Row in `user_feedback`
  mit `category='onboarding-wish'`, `is_public=false`
- Wenn `mana-analytics` nicht erreichbar ist, blockiert das Onboarding
  nicht — User kommt trotzdem auf `/`
- Bestehende Public-Feedback-Liste auf `/feedback` zeigt
  `onboarding-wish`-Records **nicht** (weil `is_public=false`)

---

## Phase 2 — Public Community-Hub *(großer Sprint, eigener Plan)*

Phase 2 wurde komplett neu geschnitten: nicht mehr nur Admin-Triage und
Buttons, sondern eine **vollständige Public-Community-Surface** mit
Pseudonym-System, Anonymisierung, omnipresenten Inline-Hooks und einem
eigenen `community`-Modul.

→ Detailplan mit Architektur-Optionen für jede Sub-Entscheidung:
**[`docs/plans/feedback-hub-public.md`](feedback-hub-public.md)**.

Kurzform der Architektur-Empfehlungen (Detail siehe Sub-Plan):
- **Anonymisierung**: Pseudonym-Hash + Tier-Display-Name ("Wachsame Eule #4528")
- **Voting**: Auth-required, aber Reactions statt simpler Votes (👍 ❤️ 🚀 🤔)
- **Inline-Hook**: Auto-Inject in `ModuleShell`-Header (opt-out per Modul) + Floating-Pille als Backup
- **Public-Surface**: Eigenes `community`-Modul + Mirror-Route außerhalb (app)/
- **Onboarding-Wish ab jetzt PUBLIC** mit Disclosure-Step

Alter Phase-2-Inhalt (Admin-Hub etc.) ist in den Sub-Plan migriert.

---

## Phase 3 — Future Categories *(Backlog, Schema-Slot offenhalten)*

Damit das Schema nicht noch mal bricht, halten wir Platz für:

- `'nps'` — Score 0-10 + optional Kommentar; nach 30 Tagen aktiver Nutzung
  einmalig getriggert. Brauche dafür eine optionale `score INT`-Spalte
  auf `user_feedback`.
- `'churn-feedback'` — wenn jemand den Account löscht: warum?
  (Pflicht-Modal vor Final-Delete.)
- `'support-request'` — 1:1-Hilfe statt öffentlicher Bug.
- `'praise'` — schon in Phase 0 mitgenommen.

→ NICHT jetzt bauen, nur als Roadmap-Marker.

---

## Phase 4 — Local-First *(deferred)*

Aktuell ist `@mana/feedback` Server-Direct-POST. Local-First lohnt sich erst,
wenn:
- Leute Feedback offline schreiben sollen (Mobile-Use-Case)
- `feedbackText` verschlüsselt im Sync laufen soll (privacy-relevant?)

Bis dahin: Status quo. Dexie-Tabelle `feedbackEntries` + `crypto/registry.ts`
+ mana-sync field-level LWW wäre der Migrations-Plan.

---

## Bekannte Drift, die wir hier NICHT angehen

- **`apps/mana/apps/web/src/lib/api/feedback.ts`** schickt an
  `getManaAuthUrl()/api/v1/feedback`. Aber `mana-analytics` (3064) ist die
  echte Heimat. Funktioniert nur, wenn mana-auth proxiet. Eigener Fix-PR.
- **Feedback fehlt in `packages/shared-branding/src/mana-apps.ts`** —
  ist nur in `apps/web/src/lib/app-registry/apps.ts`. Konsistent oder
  bewusst? Nicht in dieser Plan-Iteration.

---

## Reihenfolge & Commits

1. **Commit 1 (Phase 0)**: `refactor(feedback): align package + DB enums, add 'praise' category`
2. **Commit 2 (Phase 1)**: `feat(onboarding): add wish step, route to feedback service`
3. **Phase 2/3/4**: separate Sprints, separate Plan-Updates.
