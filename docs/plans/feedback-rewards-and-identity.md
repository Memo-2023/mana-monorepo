---
status: shipped (3.A, 3.B, 3.C, 3.F live 2026-04-27 — 3.D, 3.E open)
owner: till
created: 2026-04-27
parent: docs/plans/feedback-hub-public.md
---

# Feedback-Hub Phase 3 — Rewards, Identity & Loop-Closure

> Macht den Public-Community-Hub zu einem **lebendigen System**: User
> kriegen sofort etwas zurück (Credits), sehen ihre Wünsche durchs
> System wandern (Status-Notify), entwickeln eine Identität ohne
> Klarnamen-Zwang (Eulen + opt-in Real-Name + Pixel-Avatar), und werden
> im richtigen Moment getriggert.
>
> **Pre-launch.** Wir brechen alles was nicht passt — keine
> Backward-Compat-Shims, keine Legacy-Reste, kein "vorerst". Saubere
> Datenmodelle, klare Service-Verträge, präzise Naming.

---

## Leitprinzipien

1. **Reziprozität sofort.** Jedes Submit kriegt sofort +5 Credits, jedes
   geshippte Feature kriegt +500 Credits beim Originalwunsch-Eulen.
   Keine Verzögerung, kein "Founder approves first" — der User soll
   den Loop spüren beim ersten Submit.
2. **Loop-Closure ist Pflicht.** Wer reagiert hat, muss erfahren wenn
   sein Item shipped. Stiller Erfolg ist kein Erfolg.
3. **Identität ohne Klarname-Zwang.** Wachsame Eule #4528 ist der
   Default. User können freiwillig ihren Klarnamen mit-anzeigen, aber
   die Public-Mirror-Page bleibt **immer anonym** für SEO + Privacy.
4. **Karma ist visible.** Eine Eule mit 200 Karma wirkt anders als
   eine #1. Reputation entsteht ohne Identität.
5. **Anti-Abuse passiv.** Rate-Limits + Founder-Whitelist + LLM-Spam-
   Filter laufen serverseitig, nie als UI-Friktion.
6. **Kein Legacy.** vote/unvote/toggleVote-Shims im Package gehören
   weg. voteCount-Spalte gehört weg. Alte FeedbackPage-Markup-Stellen
   die nichts mit Reactions können gehören weg.

---

## Phase 3.A — Direkte Belohnung *(1 Tag)*

Der wichtigste Schritt. Macht den Loop spürbar.

### 3.A.1 — `/internal/credits/grant` in mana-credits

Neuer Endpoint, weil `refund` semantisch falsch wäre für "User kriegt
Credits geschenkt für Mitwirkung":

```
POST /api/v1/internal/credits/grant
X-Service-Key: <service-key>
Body: {
  userId: string;
  amount: number;
  reason: 'feedback_submit' | 'feedback_shipped' | 'feedback_reaction_match';
  referenceId: string;  // idempotency-key
  description?: string;
}
Response: {
  ok: true;
  newBalance: number;
  alreadyGranted?: true;  // when referenceId already exists
}
```

**Idempotency**: `referenceId` wird in `credits.transactions.metadata.referenceId`
gespeichert. Vor dem Grant: `SELECT ... WHERE metadata->>'referenceId' = $1
AND type = 'grant'` — wenn schon da, return `alreadyGranted: true`.

**Schema-Erweiterung**: neuer transaction-type `'grant'` (nicht `'refund'`).

### 3.A.2 — `mana-analytics` ruft auf bei `createFeedback`

In `services/mana-analytics/src/services/feedback.ts` direkt nach
dem Insert:

```ts
const [feedback] = await this.db.insert(...).returning();

// Quality-Gate: nur wenn echte Substanz drin ist
if (feedback.feedbackText.trim().length >= 20) {
  void grantCreditsForSubmit(feedback);  // fail-soft fire-and-forget
}

return feedback;

async function grantCreditsForSubmit(feedback) {
  // Founder-Whitelist (würde sich selbst beschenken)
  if (config.founderUserIds.includes(feedback.userId)) return;
  // Rate-Limit: max 10 grants/User/24h
  if (await hitGrantRateLimit(feedback.userId)) return;
  
  await fetch(`${config.creditsUrl}/api/v1/internal/credits/grant`, {
    method: 'POST',
    headers: { 'X-Service-Key': config.serviceKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: feedback.userId,
      amount: 5,
      reason: 'feedback_submit',
      referenceId: feedback.id,
      description: `Danke für dein Feedback (${feedback.category})`,
    }),
  });
}
```

**Founder-Whitelist** als config: neuer env `FEEDBACK_FOUNDER_USER_IDS`
(comma-separated). Lokal default leer, prod `<till's user-id>`.

**Rate-Limit**: `feedback_grant_log` mini-table mit (userId, grantedAt).
Cleanup: nightly DELETE WHERE grantedAt < now() - 7 days.

### 3.A.3 — `adminUpdate` triggert Ship-Bonus

Wenn Admin Status auf `'completed'` setzt (frischer Übergang):

```ts
async adminUpdate(feedbackId, patch) {
  const [old] = await this.db.select().from(userFeedback).where(eq(...));
  const [updated] = await this.db.update().set({...}).returning();
  
  // Ship-Trigger: nur beim Übergang, nicht bei Re-Saves auf 'completed'
  if (old.status !== 'completed' && updated.status === 'completed') {
    void grantShipBonus(updated);
  }
  return updated;
}

async function grantShipBonus(feedback) {
  // Originalwunsch-Eule: 500 Credits + Push-Notify
  void fetch(`${creditsUrl}/grant`, { ...500 credits, referenceId: `${id}_shipped`... });
  
  // Reagierer-Bonus: alle die 👍🚀 geklickt haben → +25 Credits
  const reactioners = await getReactionersWithEmojis(feedback.id, ['👍', '🚀']);
  for (const userId of reactioners) {
    void fetch(`${creditsUrl}/grant`, {
      userId, amount: 25, reason: 'feedback_reaction_match',
      referenceId: `${feedback.id}_reaction_${userId}`,
    });
  }
}
```

**Push-Notify** an den Original-User: nutzt mana-notify oder direkt
in-Mana toast (Phase B). Fail-soft.

### 3.A.4 — UI-Feedback "+5 Credits" beim Submit

`FeedbackQuickModal` zeigt nach Submit:

```
🎉 Danke!
Sichtbar als Wachsame Eule #4528
+5 Mana Credits
```

Statt nur "Danke!". Sofortige Belohnung erhöht Wahrscheinlichkeit für
Folge-Submits drastisch (klassischer variable-Reward-Loop).

Onboarding-Wish (Step 4) auch: Confirm-Step zeigt "+5 Mana Credits"
neben dem Pseudonym.

---

## Phase 3.B — Loop-Closure *(1 Tag)*

User sieht/spürt was mit seinem Wisch passiert.

### 3.B.1 — Status-Notify bei Status-Change

Wenn ein Wisch von `submitted` → `planned` → `in_progress` →
`completed` wandert: Push-Notification an

- den Original-Author
- alle die 👍 oder 🚀 reagiert haben

Server-side via mana-notify (oder in-Mana via mana-sync activity-stream).

Beispiel-Texte:
- `submitted` → `planned`: "Geplant: dein Wunsch ›{title}‹ ist auf der Roadmap"
- `planned` → `in_progress`: "Wir bauen ›{title}‹ gerade"
- `in_progress` → `completed`: "🎉 ›{title}‹ ist live! +500 Mana"

### 3.B.2 — `/profile/my-wishes` Persönliche Roadmap

Eingeloggter User sieht eine Liste aller eigenen Wishes mit live
Status-Badge + Reaction-Count. Plus "Items, auf die ich reagiert habe"
unten dran. Reactivate user even when they didn't post recently.

Endpoint existiert schon (`getMyFeedback`), nur eine View bauen.

### 3.B.3 — Monthly-Digest E-Mail

Anfang jedes Monats: "April-Digest — diese 7 Wünsche wurden umgesetzt"
+ Founder-Note. An alle User die im letzten Monat reagiert oder gepostet
haben. Cron im mana-analytics, sendet via mana-mail/SMTP.

**Aufwand**: 4-6h (Templates + Cron + opt-out).

---

## Phase 3.C — Identität & Sichtbarkeit *(1 Tag)*

### 3.C.1 — Opt-In Klarname-Toggle

`auth.users` neue Spalte:

```sql
ALTER TABLE auth.users
  ADD COLUMN community_show_real_name boolean NOT NULL DEFAULT false;
```

UI: Settings → Community → Switch "Klarnamen neben Pseudonym zeigen".

**Server-Logik**:
- Im `/api/v1/feedback/public` (auth-required-Variante): wenn der ANGEFRAGTE post-Author `community_show_real_name = true` hat, extra Feld `realName: 'Till'` neben `displayName`. Sonst `realName: undefined`.
- Im `/api/v1/public/feedback/feed` (anonymous-Variante): **niemals** Klarname ausliefern, egal was der Toggle sagt. Public-Mirror bleibt safe.

UI-Anzeige bei `realName`:
```
Wachsame Eule #4528 · Till
```

### 3.C.2 — Pixel-Art-Avatar aus display_hash

Pure-function Avatar-Generator (`packages/feedback/src/avatar.ts`):

```ts
export function generateAvatarSvg(displayHash: string): string {
  // Aus dem Hash 8-byte slices extrahieren:
  //  - eyeColor (3 bytes → HSL)
  //  - bodyColor (3 bytes → HSL)
  //  - pattern (1 byte → 8 sortes-of-feathers)
  //  - shape (1 byte → eule/otter/fuchs/...)
  
  return `<svg viewBox="0 0 32 32" xmlns="...">
    ${pixelGrid(shape, eyeColor, bodyColor, pattern)}
  </svg>`;
}
```

32×32 SVG, deterministisch, keine externes Dep, kein Storage. Wird in
`ItemCard.svelte` neben dem Display-Name angezeigt.

**Effekt**: jedes Pseudonym hat ein Gesicht → wirklicher Charakter, nicht
nur Text.

### 3.C.3 — Karma-System

Neue Spalte auf `auth.users`:

```sql
ALTER TABLE auth.users
  ADD COLUMN community_karma integer NOT NULL DEFAULT 0;
```

Karma += 1 für jede Reaction die jemand auf einem deiner Posts macht
(`post_owner_user_id`-Lookup beim React).

Tier-Abbildung:
- 0-9 Karma → Bronze Eule (default)
- 10-49 → Silver Eule
- 50-199 → Gold Eule
- 200+ → Platinum Eule

UI: kleines Tier-Icon neben dem Display-Name (bronze 🦉₂, silver 🦉₃, …).

**Realtime**: bei jedem `toggleReaction` updaten wir Karma des Post-Owners atomar in derselben Transaction. Read-side: `community_karma` in Public-Feed-Output mit ausliefern.

### 3.C.4 — Eulen-Profil `/community/eule/{display_hash}`

Public-Page: zeigt alle Posts dieser Eule + Total-Karma + Tier-Badge +
Avatar. Auch ohne Login zugänglich (SSR via Public-Endpoint).

`GET /api/v1/public/feedback/eule/{display_hash}` — neuer Endpoint.

---

## Phase 3.D — Engagement-Mechaniken *(1-2 Tage, später)*

Diese Features bringen Fortgeschrittene-Engagement, kommen NACH 3.A-C live.

### 3.D.1 — "+12 wollen das auch"-Counter

Im FeedbackQuickModal beim Tippen: parallel ein semantischer Search
gegen existierende Wishes. Wenn überschneidung > Schwelle:

```
Ähnliches existiert schon:
[Wachsame Eule] "Ich wünsche mir Y für meine Tagebücher"
🚀 12 weitere Eulen wollen das auch.

[Diesem Wisch beitreten] [Eigenen schreiben]
```

Multiplier-Effekt: 1-Klick-Mitvoten statt eigener Submit.

Server: `POST /api/v1/feedback/match-existing` mit `feedbackText` →
LLM-Embedding gegen alle public top-level Items, gibt Top-3 zurück.

### 3.D.2 — 🔥 Trending-Badge

Items mit ≥5 neuen Reactions in 24h kriegen `🔥 Trending`-Badge im Feed.
Computed-Column oder Cron. UI: kleines flammendes Badge.

### 3.D.3 — Eulen-Compass

`GET /api/v1/feedback/me/similar-eulen` returns Top-5 Eulen, mit denen
dein User die meisten Reactions teilt.

UI: kleiner Discovery-Block in `/profile/my-wishes`:
"Du denkst ähnlich wie: Falke #2891, Otter #4823 …"

### 3.D.4 — Wochenquest

Cron schreibt jeden Montag eine Quest in `_userQuests`:

- "5 Reactions abgeben → +10 Credits"
- "Eigenen Wisch posten → +5 Credits"
- "3 Replies posten → +5 Credits"

UI: Card in der Workbench (oder in /community/quest), zeigt Progress.

---

## Phase 3.E — Smart-Triggers & Voice *(Backlog)*

### 3.E.1 — Frust-Detector

Module-Aktion 3× hintereinander aborted (cancel/back/error) → Pop-up:

```
Hängst du? Was nervt hier?
[Quick-Submit-Modal mit Module-Context vorausgefüllt]
```

Detection: action-event-counters in `_uxTelemetry` Dexie-Table.

### 3.E.2 — Post-Success-Rush

Mission completed, Goal erreicht, Drink-Streak gehalten →

```
🎉 Geschafft!
Was hat dir am meisten geholfen? (1 Klick → Lob-Submit)
```

### 3.E.3 — Voice-Submit

Mic-Icon im FeedbackQuickModal → `@mana/local-stt` (Whisper, WebGPU)
transkribiert lokal. Senken die Hürde dramatisch (besonders mobil).

```svelte
<MicrophoneButton onTranscript={(text) => bind value text} />
```

3-4h Code, weil local-stt schon da ist.

### 3.E.4 — Companion-Drafted-Wish

Companion bemerkt im Chat-Verlauf "X nervt" o.ä. → fragt einmal
"Soll ich das fürs Team aufschreiben?" → drafted Wish, User reviewed.

Pattern: Companion liest periodisch deine eigenen Notes/Chats (lokal),
sucht nach Frustsignal (`'nervt'|'doof'|'kaputt'|...`-pattern), bietet
1× per session den Submit-Helper an.

---

## Phase 3.F — Legacy-Cleanup *(2h, parallel zu 3.A)*

Pre-launch ist die Chance, Halb-Migrationen sauber zu schließen.

### 3.F.1 — Drop vote/unvote/toggleVote/getPublicFeedback shims

In `packages/feedback/src/createFeedbackService.ts`:

```ts
// LEGACY (DROP):
async function vote(feedbackId): Promise<VoteResponse> { ... }
async function unvote(feedbackId): Promise<VoteResponse> { ... }
async function toggleVote(feedbackId): Promise<VoteResponse> { ... }
async function getPublicFeedback(query?): Promise<FeedbackListResponse> { ... }
```

Plus die `VoteResponse`-type in `api.ts`. Plus `VoteButton.svelte` (wir
nutzen ReactionBar exklusiv). Plus `userHasVoted`-Feld auf `Feedback`.

### 3.F.2 — Drop voteCount-Spalte aus user_feedback

```sql
ALTER TABLE feedback.user_feedback DROP COLUMN vote_count;
```

Ist schon obsolet seit Phase 2 (Reactions ersetzen Votes vollständig),
aber wir hatten's behalten "für Backward-Compat". Pre-launch braucht's
das nicht.

### 3.F.3 — FeedbackPage.svelte refactor

Die Component aus dem Package ist Pre-Phase-2 (Tabs, Vote-Button,
keine Reactions). Sie wird von `apps/mana/apps/web/src/lib/modules/feedback/ListView.svelte`
benutzt — aber das ganze `/feedback`-Modul ist jetzt überflüssig
**(nur Bug-Reports, was Community macht besser)**.

**Empfehlung**: Modul `/feedback` ganz droppen. App-Registry-Eintrag
löschen. Existierende Records bleiben in der DB, die werden ja über
`/community` und `/community/admin` weiter angezeigt.

### 3.F.4 — Drop FeedbackVote-Type und `feedback_votes` Tabelle

`feedback_votes` ist schon weg (in 0002), aber der Type-Export ist
nirgends entfernt. Drop alle Referenzen.

---

## Reihenfolge

1. **Phase 3.A** ✅ shipped 2026-04-27 — Credits-Loop
   - dbe24acfc + eecf64c1c (server + UI), e89958e9c (port-fix)
   - mana-credits transaction-type 'grant', `/internal/credits/grant` idempotent
   - mana-analytics +5/+500/+25 mit Founder-Whitelist + Rate-Limit
   - Reward-Chip in FeedbackQuickModal + Onboarding-Wish-Confirm
2. **Phase 3.F** ✅ shipped 2026-04-27 — Legacy-Cleanup
   - eecf64c1c — vote/unvote/toggleVote shims raus, voteCount drop, /feedback Modul + Route gelöscht
3. **Phase 3.B** ✅ shipped 2026-04-27 — Loop-Closure
   - 3a18a5e50 — feedback_notifications-Tabelle, Status-Notify + AdminResponse-Notify, Toast-Polling
   - /profile/my-wishes mit 3 Tabs (Eigene/Unterstützt/Inbox)
   - Migration 0004
4. **Phase 3.C** ✅ shipped 2026-04-27 — Identität
   - ee5bb2871 + 1b30c3655 — Pixel-Identicon-Avatar (deterministic SVG), Klarname-Toggle
     mit Settings-Section, Karma-System mit Bronze/Silver/Gold/Platin-Tiers,
     /community/eule/[hash] Public-Profil mit SSR
   - Migration `services/mana-auth/sql/008_community_identity.sql`
   - Cross-schema-JOIN auth.users in mana-analytics
5. **Phase 3.D** ⏸ offen — Engagement (Trending, Compass, Quests, Match-Existing)
6. **Phase 3.E** ⏸ offen — Smart Triggers (Frust-Detect, Voice, Companion)

---

## Datenmodell-Änderungen

### mana-credits (`mana_platform.credits`)

```sql
-- Erweitert die transaction-type-Enum:
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'grant';

-- Neuer Index für Idempotency-Lookup auf metadata.referenceId:
CREATE INDEX IF NOT EXISTS transactions_reference_id_idx
  ON credits.transactions((metadata->>'referenceId'))
  WHERE metadata->>'referenceId' IS NOT NULL;
```

### mana-analytics (`mana_platform.feedback`)

```sql
-- Mini-Tabelle für Rate-Limit-Counter:
CREATE TABLE IF NOT EXISTS feedback.feedback_grant_log (
  user_id text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,
  PRIMARY KEY (user_id, granted_at)
);
CREATE INDEX feedback_grant_log_recent_idx
  ON feedback.feedback_grant_log(user_id, granted_at DESC);

-- Drop legacy:
ALTER TABLE feedback.user_feedback DROP COLUMN IF EXISTS vote_count;
```

### auth (Phase 3.C)

```sql
ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS community_show_real_name boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS community_karma integer NOT NULL DEFAULT 0;
```

---

## Anti-Abuse-Patterns

| Pattern | Mechanismus | Wo |
|---|---|---|
| Self-grant durch Founder | `FEEDBACK_FOUNDER_USER_IDS` Whitelist | mana-analytics service |
| Spam-Submit für Credits | Rate-Limit 10/Tag, Mindest-20-Zeichen | mana-analytics service |
| Empty/Junk-Submits | LLM-Quality-Check (ist es ernst gemeint?) | mana-analytics service, fail-soft |
| Reaktions-Farming | Rate-Limit 30 reactions/Tag | mana-analytics service |
| Multi-Account Sock-Puppets | 1 user = 1 Eule (Pseudonym deterministisch); 1 reaction pro user pro emoji per item | DB-Constraint feedback_reactions_unique |
| Doppel-Grants bei Re-Save | `referenceId` als idempotency-key | mana-credits transaction.metadata |
| Status-Hin-Und-Zurück → mehrfacher Ship-Bonus | Trigger fires nur beim Frisch-Übergang, plus referenceId `<id>_shipped` | mana-analytics adminUpdate |

---

## Risiken & Open Questions

- **Wie hoch ist 500 Credits "wirklich"?** — Sync kostet 30/Monat → 500 = ~17 Monate Sync. Ist das OK? Falls zu großzügig: 200 Credits. Bauen wir mit 500, justieren später wenn nötig.
- **Founder-Whitelist auf prod**: muss 1× per Hand gesetzt werden (FEEDBACK_FOUNDER_USER_IDS env), Memory-Pin nicht vergessen.
- **Spam-Detection durch LLM**: optional fail-soft, aber wenn LLM down → einfach durchlassen (sonst legitimes Feedback blockiert).
- **Status-Notify-Spam**: wenn Admin Status oft hin-und-her ändert → User wird mit Push-Notifications zugeschüttet. Mitigation: nur beim Frisch-Übergang notify, nicht bei jedem Status-Set. (Schon im Plan.)
- **Karma-Inflation**: alte Posts kriegen über Zeit immer mehr Reactions, neue starten bei 0. Mitigation: Voting-Decay (Phase 3.D.X später).
- **"Founder bekommt selbst keine Credits"**: macht keine Founder-Wishes-Stories möglich ("Till hat sich das gewünscht"). Die Whitelist ist also strict. Alternative: Founder kriegen Credits aber als "FOUNDER"-Tier-Karma 0. Diskutierbar.

---

## Test-Plan

Nach jedem Phase-Ship:

1. **Submit-Test**: User postet einen Wisch ≥20 Zeichen → kriegt sofort +5 Credits sichtbar.
2. **Rate-Limit-Test**: 11. Submit innerhalb 24h → kein Bonus, Submit gelingt aber.
3. **Founder-Test**: Founder-User postet → kein Bonus.
4. **Ship-Test**: Admin schiebt Wisch auf 'completed' → Original +500 Credits, Reagierer +25 Credits, Push-Notify ankommen.
5. **Ship-Idempotency**: Admin schiebt 'completed' → 'in_progress' → 'completed' → keine Doppel-500-Credits.
6. **Klarname-Test**: User aktiviert Toggle → in `/community` (auth) sichtbar; in `mana.how/community` (anonymous) **nicht** sichtbar.
7. **Karma-Test**: User A postet, User B reagiert → A's `community_karma` += 1, A's Tier-Badge update.

---

## Naming, Commit-Stil, etc.

- Keine "v2"-Suffixe, kein "old/new"-Doppel-Code.
- Migrationen werden `0003_<purpose>.sql`, `0004_*.sql` …
- Commit-Format wie bisher: `feat(scope): kurze Beschreibung`, body German+English mix erlaubt.
- Plan-Doc-Updates inline, keine Sub-Docs (außer es wird sehr groß).
