---
status: draft
owner: till
created: 2026-04-26
parent: docs/plans/feedback-hub.md
---

# Feedback-Hub — Public, Anonymous, Omnipresent

> Erweitert `docs/plans/feedback-hub.md` um die "alles öffentlich + anonym +
> überall einsammelbar"-Vision. Statt eines stillen Bug-Tracker-Moduls
> wird `@mana/feedback` zu einem sichtbaren Community-Layer, der überall
> in Mana präsent ist und nach außen hin als öffentliches Roadmap-Board
> wirkt.

---

## Leitprinzipien

1. **Privat by default ist tot.** Alles Feedback ist öffentlich anzeigbar, sortiert nach Votes, sichtbar ohne Login. Nur explizit als `private` markierte Sub-Categories (`churn-feedback`, `support-request`) bleiben zurückgehalten.
2. **Anonym, aber nicht entkoppelt.** Niemand sieht "Till Schäfer hat gewünscht…". Stattdessen ein deterministisches Pseudonym ("Wachsame Eule #4528"), das **konsistent über die Zeit** ist (selber User = selbe Eule), aber nicht zur Identität zurückführbar.
3. **Omnipresent.** Jedes Modul, jede Workbench-Page hat einen Feedback-Touchpoint. Nicht aufdringlich, aber 1-Klick erreichbar.
4. **Public Surface = Marketing-Asset.** Die `/community`-Page ist auch ohne Login lesbar, googelbar, embeddable. Sie zeigt das Produkt als "lebendiges System mit echten Stimmen".
5. **Read-cheap, write-thoughtful.** Lesen ist gratis (anonym, ohne Auth). Submit + Vote brauchen Login — gegen Spam und für Pseudonym-Konsistenz.

---

## Architektur-Entscheidungs-Punkte

Jede Entscheidung mit 2–3 Optionen, Empfehlung markiert.

### A. Anonymisierungs-Modell

| Option | Wie | Pro | Con |
|--------|-----|-----|-----|
| **A1. Wirklich anonym** | Server speichert userId nicht, nach Submit verloren | Maximum Trust, kein Doxing möglich | User kann eigenes Feedback nicht editieren/löschen, kein "Mein Feedback"-Tab |
| **A2. Pseudonym-Hash** | Server speichert `displayHash = SHA256(userId + serverSecret)`. UserId unsichtbar, aber Hash recomputable bei Login. | User sieht eigene Posts wieder, kann Edit/Delete. Cross-Post-Identifikation nicht möglich. | Mehr Komplexität. Server-Secret-Rotation = alle Hashes verlieren Verbindung. |
| **A3. Pseudonym + Display-Name** ⭐ | Wie A2, **plus** ein deterministisches Tier-Pseudonym ("Wachsame Eule #4528") aus Hash abgeleitet. Anzeige in UI. | Lesefreundlich ("ah die Eule wieder"), Nutzer-Wiedererkennung ohne Identitätspreisgabe. Konsistenz schafft Reputation-Layer ohne Real-Name. | Pseudonym ist deterministisch persistent — wer ein Posting eindeutig zuordnen kann (z.B. weil Sub-Bio enthält), könnte alle Posts dieser Eule traversieren. |

**Empfehlung: A3.** Reputation + Wiedererkennung ohne Klar-Identität ist das Sweet-Spot, das Communities lebendig macht (Reddit-Pattern).

**Open question**: Soll User Pseudonym selbst ändern können? Empfehlung **nein** — sonst kann man Sock-Puppet-mäßig agieren. Pseudonym ist serverside fest, einmal generiert.

### B. Storage-Erweiterungen am `user_feedback`-Table

Neue Spalten:

```sql
ALTER TABLE feedback.user_feedback
  ADD COLUMN display_hash text,         -- SHA256(userId + secret)
  ADD COLUMN display_name text,         -- "Wachsame Eule #4528"
  ADD COLUMN module_context text,       -- 'todo' | 'notes' | … | NULL
  ADD COLUMN parent_id uuid REFERENCES feedback.user_feedback(id),  -- für Threading
  ADD COLUMN published_to_public boolean DEFAULT true;
```

`userId` bleibt für Server-internen Lookup (Edit/Delete-Berechtigung); wird **nie** im Public-Endpoint ausgeliefert.

Tier-Namen-Generation: `services/mana-analytics/src/lib/pseudonym.ts` (Wortliste ~150 Adjektive × 80 Tieren = 12.000 Kombinationen + 4-stellige Suffix → ~120M unique). Deterministisch aus `display_hash`.

### C. Voting-Modell

| Option | Wie | Pro | Con |
|--------|-----|-----|-----|
| **C1. Anonym votable** | Vote per IP-Hash, rate-limited (1×/Item/Tag) | Maximum Reach — nicht-User können auch interagieren | Manipulationsanfällig (VPN, mehrere Geräte), keine Reputation |
| **C2. Auth-required Voting** ⭐ | Lesen ohne Login, Voten nur eingeloggt | Schutz gegen Brigading, sauberer Signalwert. Pattern: GitHub Discussions, Stack Overflow. | Nicht-User können nicht teilnehmen → Kalt-Start-Problem |
| **C3. Reactions statt Votes** | Slack-style Emojis (✋ "ich auch", ❤️ "love", 🤔 "?", 🚀 "ship it") | Reicheres Signal, weniger Hot-or-not. | Komplizierter zu sortieren; "Top-Voted" nicht mehr eindeutig |

**Empfehlung: C2 + C3 in Kombination** — auth-required, aber statt simpler `voteCount` ein `reactions: jsonb` mit Emoji→Count-Map. Sortier-Score = gewichtete Summe (👍 = 1, 🚀 = 2, 🤔 = 0).

### D. Inline-Feedback-Pattern (Module-Touchpoints)

| Option | Wie | Pro | Con |
|--------|-----|-----|-----|
| **D1. Globale Floating-Pille** | Ein "Idee?"-FAB rechts unten, immer da. Modal mit Auto-Context aus aktueller Route. | Modul-agnostisch, eine Stelle, einfach gepflegt. Kontext-Auto-Detection eliminiert Reibung. | Floating-Buttons werden tot-blickt ("Banner-Blindness"). Keine Modul-spezifische Triage. |
| **D2. ModuleShell-Footer-Slot** | Erweitere `ModuleShell` um optionalen `feedback_pill`-Snippet im Footer/Header. Module aktivieren explizit. | Modul-spezifischer Kontext, opt-in pro Modul. Konsistente Position. | Module müssen Code touchen. Bei 27 Modulen viel Boilerplate. |
| **D3. Auto-Inject in jede ModuleShell** ⭐ | ModuleShell rendert default einen kleinen `<FeedbackHook moduleId={appId} />` im Header rechts neben den Window-Actions. `appId` aus Context. Modul kann via prop opt-out (`hideFeedback={true}`). | Wirklich überall ohne Modul-Code. 100% Coverage. Konsistenter Touchpoint. | Header-Krempel — bei 7+ Action-Buttons schon eng. Mobile-Layout muss überlegt werden. |
| **D4. Slash-Command in QuickInput** | User tippt `/feedback ich finde…` in der globalen QuickInput-Bar | Power-User-Friendly, kein UI-Eingriff. | Hidden — normale User finden's nie ohne Onboarding. |

**Empfehlung: D3 als Baseline + D1 als Backup für Routes außerhalb Module-Shells** (z.B. Settings, Profile). D3 erreicht jeden Workbench-Touch automatisch; D1 fängt den Rest auf. D4 als nice-to-have on top für Power-User.

`<FeedbackHook moduleId>` rendert: kleines Icon-Button (Lightbulb / Megaphone), Click öffnet Modal mit:
- Vorausgefüllter Context: "Modul: Todo" Badge
- Category-Auto-Default: `feature` (oder via dropdown ändern)
- Free-text 2000 chars
- Submit → POST + Toast "Danke! Sichtbar als 'Wachsame Eule #4528'"

### E. Public-Display-Surface

| Option | Wie | Pro | Con |
|--------|-----|-----|-----|
| **E1. Eigenes Modul `/community`** ⭐ | Neues Modul `community/`. List/Detail-Views. Public-Route auch unter `/community` (kein AuthGate). | Konzeptuell sauber, eigene Workbench-Card, klare Trennung "mein Feedback" vs "alle". Eigene URL = Marketing-asset. | Mehr Code (Module-Pattern voll auszubauen). |
| **E2. Erweiterte `/feedback`-Page** | Bestehende Page um "Public"-Tab und Public-Mirror auf `/feedback` (auth-bypass) | Weniger Module-Mehrarbeit | Mischung "intern + extern" auf einer URL ist verwirrend. Ein `requiredTier=guest`-Modul lässt sich schlecht mit Auth-Bypass kombinieren. |
| **E3. Eigene Domain `feedback.mana.how`** | Standalone-Surface, eigenes Astro-Build | Maximum Brand-Trennung, Marketing-Standalone. | Sehr aufwendig, Aufwand:Nutzen-Ratio schlecht für jetzt. |

**Empfehlung: E1.** Neues Modul `community`, Route `(app)/community` für eingeloggte User (Workbench-Card-fähig), **plus** Mirror unter `/community` (außerhalb (app)/, ohne AuthGate) für Public-Access. Beide Routes rendern dieselben Daten, nur Voting/Submit ist auf der Auth-Variante aktiv.

### F. Workbench-Integration

`community`-Modul muss workbench-card-fähig sein. Ergibt:

- `lib/modules/community/module.config.ts` — `appId: 'community'`, **keine** Tabellen (server-only, kein Local-First)
- `lib/modules/community/queries.ts` — Fetch via `feedbackService.getPublicFeed()` (neuer Endpoint), in-Memory mit SWR-Pattern (kein liveQuery)
- `lib/modules/community/views/ListView.svelte` — Top-Voted-Liste, Filter nach Modul, Status, Kategorie
- `lib/modules/community/views/DetailView.svelte` — Single-Item mit Replies (Threading)
- `lib/modules/community/views/RoadmapView.svelte` — Items mit `status='planned'` oder `'in_progress'`, Kanban-Style
- `app-registry/apps.ts` — Eintrag mit Icon (Megaphone? Lightning?), Color (z.B. `#F59E0B`)
- `mana-apps.ts` — globale Registrierung mit `requiredTier: 'guest'` (Public-Modul!)
- Drag-Source für Workbench: dropp-able auf jede Scene

### G. Anonymisierungs-Schutz beim Submit

Wichtig: Wenn Onboarding-Wishes ab jetzt PUBLIC sind, muss der UI klar machen "**das ist öffentlich, anonym aber sichtbar**". Sonst Vertrauensbruch.

Onboarding-Wish-Screen Update:
> *Was wünschst du dir? Schreib einfach, wie's dir kommt. Wir zeigen das öffentlich auf unserer Community-Page als "{tier-name}", aber nicht mit deinem Namen.*

Plus: Preview-Step nach Submit: "Hier wirst du auftauchen → [Eule-Preview]". User kann zurück und edit/delete vor Submit.

---

## Implementierungs-Reihenfolge

### Phase 2.1 — Anonymisierungs-Foundation
- Neue Spalten `display_hash`, `display_name`, `module_context`, `parent_id`, `published_to_public` in `feedback.user_feedback`
- Pseudonym-Generator (Tier+Adjektiv+Number aus Hash)
- Server `createFeedback`: stamp `display_hash` + `display_name` automatisch
- `getPublicFeed`-Endpoint (neu, **kein Auth**, nur Public + isPublic-Filter, redacts userId)
- `feedbackService` um `getPublicFeed()` erweitern (kann ohne `getAuthToken`)

### Phase 2.2 — Voting + Reactions umbauen
- Spalte `reactions jsonb` ergänzt (Map emoji→count)
- Server-Endpoint `POST /api/v1/feedback/:id/react` (auth-required) toggelt Reaction für `userId`
- VoteButton erweitert zu ReactionBar (emoji-row mit Counts)
- Sortier-Score-Logik im Backend

### Phase 2.3 — Inline-Hook in ModuleShell
- `<FeedbackHook moduleId>` Component bauen
- ModuleShell um `<FeedbackHook>` im Header-Right erweitern, opt-out via `hideFeedback`
- Modal-Component (FeedbackQuickModal) mit Auto-Context, Category-Picker, Free-Text
- Toast-Bestätigung "Sichtbar als …"

### Phase 2.4 — Globale Floating-Pille
- Component `<GlobalFeedbackPill />` in `routes/(app)/+layout.svelte` mounten
- Auto-Detection des Module-Context aus URL/Active-Scene

### Phase 2.5 — Community-Modul
- Modul-Skeleton (`module.config.ts`, `queries.ts`, `views/`)
- ListView mit Top-Voted, Filter, Suchfeld
- DetailView mit Threading (Replies)
- RoadmapView (planned/in-progress als Kanban)
- App-Registry-Eintrag, mana-apps.ts-Registrierung mit `requiredTier: 'guest'`

### Phase 2.6 — Public-Mirror-Route
- `routes/community/+page.svelte` (außerhalb (app)/, kein AuthGate)
- SSR-Pre-Render via SvelteKit `+page.server.ts` für SEO
- Read-Only-Modus: Voting-Buttons disabled mit Tooltip "Login zum Mitmachen"
- robots.txt + sitemap.xml updaten

### Phase 2.7 — Onboarding-Wish öffentlich machen
- `onboarding/wish/+page.svelte`: Text-Update mit Public-Disclosure
- Preview-Step ("Hier wirst du auftauchen") vor Submit
- `isPublic: true` (statt aktuell `false`)
- Wishes erscheinen ab sofort im `/community`-Feed

### Phase 2.8 — Admin-Triage
- `/community/admin` (founder-tier-gated) für Status-Updates, Adminresponse, Reaktion auf Threads

---

## Phase 3 — Mächtiger machen *(Roadmap, separater Sprint)*

Diese Features kommen nach 2.x. Jeder Punkt ist 1–3 Tage.

### 3A. Threading / Replies
Feedback-Records können `parent_id` haben → User antworten auf Wishes. UI: Discord-style Reply-Indent. Reaktionen pro Reply.

### 3B. Status-Notifications
User reaktet auf Item → bekommt Notify wenn Status sich ändert. "Dein Like-Item ist jetzt 'planned'." Rendering: in Mana's `/inbox` oder als Email-Digest.

### 3C. Auto-Tagging via LLM
Beim Submit: mana-llm extrahiert 2–4 Tags ("ui", "performance", "ai", "mobile"). Speicherung in `tags text[]`. Filter im UI nach Tag.

### 3D. Roadmap-Page
View: Kanban-Spalten "Submitted | Planned | In Progress | Shipped". Items mit Vote-Count + Module-Badge. Public-View ohne Login.

### 3E. Companion-Awareness
AI-Companion liest Feedback-Records des Users (über mana-mcp-Tool) und referenziert: "Du hattest dir vor 3 Wochen X gewünscht — wir haben das jetzt gebaut, schau hier." Pro-Active-Notification beim Login.

### 3F. Cross-Modul-Verknüpfung
Wenn User schreibt "ich will dass meine Notiz X…", kann Feedback-Item auf konkrete Records linken (`relatedRecordIds: text[]`). UI zeigt Modul-Badge + Link.

### 3G. Sentiment-Cluster
Monatlicher LLM-Job: clustert alle Submissions nach Sentiment (positiv/negativ/neutral) und Topic. Admin-Dashboard zeigt Trend-Lines. Founder kriegt einen "Mood of the Community"-Pulse.

### 3H. Embeddable Public-Roadmap
`<iframe src="https://mana.how/community/embed?status=planned" />` für Landing-Page. Wir können auf der Marketing-Site die "lebendige Roadmap" einblenden.

### 3I. Newsletter-Aggregation
Monatlich auto-Newsletter an alle Voter: "Diese Wünsche wurden im April umgesetzt:". Gewinnt das Doom-Loop von "wo ist mein Feature?".

### 3J. Reputation-System
`Wachsame Eule #4528` sammelt Karma (eigene Reactions + Replies anderer). Im Profil sichtbar. Gamification ohne Identitätspreisgabe.

### 3K. Voting auf Inline-Hook-Submission
Beim Submit über Inline-Hook: zeige sofort 3 ähnliche existierende Wishes ("Du wolltest schreiben — wurde so was schon gewünscht?"). Reduce Duplicates, encourage Voting.

### 3L. Cross-Server Feedback-Aggregation
Wenn Mana mal mehrere Workspaces hat (Spaces ÷ Server): Feedback ist global, aber Filter "nur mein Space" verfügbar.

### 3M. Privater Sub-Channel pro Space
Spaces können einen eigenen `space_feedback`-Stream haben — Member-only. Trennung Community-Public ↔ Team-Private.

### 3N. AI-generated Reply Suggestions für Founder
Wenn jemand fragt "warum X?", gibt's einen LLM-Suggestion-Button für die Antwort, gefüttert mit allen vorigen Posts + Code-Status. Founder-Speed-Boost für Triage.

### 3O. Voting-Decay
Votes haben Halbwertszeit (z.B. 90 Tage), damit alte Wishes nicht ewig die Top dominieren. Frische gewinnt.

### 3P. "Was würdest du als nächstes wollen?"-Quiz
Periodischer Pop-Up: "Schau dir unsere Roadmap an, vote was du als nächstes willst." Aktivierung des Long-Tails.

---

## Bekannte Risiken / Gegen-Argumente

- **Spam-Risk**: Anonyme Posts bei steigendem Traffic. Mitigation: Auth-required für Submit, IP-Rate-Limit ~10/Tag, LLM-Spam-Detection.
- **Toxic-Content-Risk**: Anon-Plattformen ziehen Trolle. Mitigation: Pre-Submit-Profanity-Filter (LLM), Founder-Mod-Tools, "Report this Post"-Button.
- **Doxing via Pseudonym-Konsistenz**: Eule schreibt persönliche Details → über mehrere Posts identifizierbar. Mitigation: Onboarding-Disclosure ("schreib nichts persönlich Identifizierendes").
- **Privacy-Reset-Wunsch**: User will eigenes altes Feedback komplett löschen. Mitigation: "Account-Reset" → alle Records mit seinem `display_hash` werden auf "anonym gelöscht" gesetzt (Soft-Delete, kein DELETE).
- **Onboarding-Wish öffentlich = scary**: User schreibt im Onboarding ehrlich, will aber nicht öffentlich auftauchen. Mitigation: Toggle "Auch öffentlich anzeigen?" mit Default-on aber sichtbar/abwählbar.

---

## Empfohlener "Phase 2.0 Minimal" für ersten Launch

Wenn du nicht alles am Stück bauen willst, ist das die kleinste sinnvolle Version:

1. Phase 2.1 (Anonymisierung) — DB + Pseudonym-Generator
2. Phase 2.5 (`community`-Modul) ohne Threading, ohne Roadmap-View
3. Phase 2.6 (Public-Mirror-Route) read-only
4. Phase 2.7 (Onboarding-Wish öffentlich) mit Disclosure

Drei Tage Arbeit, schon ist die Community-Surface live. Phase 2.2/2.3/2.4 + Phase 3.x staffeln wir danach.
