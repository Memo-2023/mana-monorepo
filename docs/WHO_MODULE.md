# `who` Module — Plan / RFC

**Status:** Draft, awaiting review
**Author:** Refactoring sweep, 2026-04-09
**Replaces:** `games/whopixels/` (standalone Phaser app + Node http server + Azure OpenAI direct integration)

---

## Goal

Port the core mechanic of `whopixels` — chatting with an LLM that
roleplays a historical figure without revealing their identity, until
the user guesses correctly — into a normal Mana module that lives in
the unified web app.

The Phaser RPG world wrapper around the chat (~80% of the original
code) is dropped. The chat loop, the 26 historical-figure
personalities, and the `[IDENTITY_REVEALED]` win-detection trick are
the parts worth preserving.

The standalone `whopixels` container is removed once the new module
ships. Net code delta: roughly **−3 200 LOC of phaser/server/static
assets** in exchange for **~1 000 LOC of typed module code** that
plugs into the existing infrastructure (auth, sync, encryption,
mana-llm, mana-credits).

## Naming

`who` — short, free across `apps/mana/apps/web/src/lib/modules/`,
`packages/shared-branding/src/mana-apps.ts`, and the route tree.
References the lineage from whopixels without inheriting the
misleading "pixels" half.

## High-level architecture

```
┌─────────────────────────────────────────────────┐
│  apps/mana/apps/web/src/lib/modules/who/        │
│  ─────────────────────────────────────────       │
│  module.config.ts   ← register Dexie tables     │
│  collections.ts     ← whoGames, whoMessages     │
│  queries.ts         ← live game list, messages  │
│  stores/games.svelte.ts                         │
│    startGame(deckId, characterId?)              │
│    sendMessage(gameId, text)                    │
│    surrender(gameId)                            │
│    replay(gameId)                               │
│  data/decks.ts      ← public character metadata │
│                       (id, deck, difficulty,    │
│                        category — NO names,     │
│                        NO personality)          │
│  ListView.svelte                                │
│  views/                                         │
│    DeckPicker.svelte                            │
│    PlayView.svelte                              │
│    ResultView.svelte                            │
└─────────────────────┬───────────────────────────┘
                      │ POST /api/v1/who/chat
                      │   { gameId, characterId,
                      │     message, history[] }
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  apps/api/src/modules/who/routes.ts             │
│  ─────────────────────────────────────────       │
│  POST /chat                                     │
│    1. Look up character by id (server-side)     │
│    2. Build system prompt with hidden personality│
│    3. validateCredits + consumeCredits          │
│    4. Forward to mana-llm                       │
│    5. Detect [IDENTITY_REVEALED] sentinel       │
│    6. Return { reply, identityRevealed }        │
│                                                 │
│  GET /decks                                     │
│    Public catalogue: deck list + counts         │
│    (NO names, NO personalities)                 │
│                                                 │
│  data/characters.ts                             │
│    The 26 (and later more) NPC definitions.    │
│    Server-only — never sent to clients.        │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
              mana-llm gateway
              (Ollama / Azure / OpenRouter)
```

The split is the key idea: **the personalities never leave the
server**. Frontend only knows opaque numeric character IDs and the
deck/category they belong to (so it can show "Erfinder, mittel" as
the difficulty hint). When the user reveals the identity, the server
returns the resolved name as part of the reply.

This rules out the obvious cheat — opening DevTools and grepping the
JS bundle for "Marie Curie".

## Why `apps/api` and not a new service

The chat loop is thin: one HTTP endpoint, one mana-llm call, one
Postgres-free in-memory dispatch table for character data. It is the
exact shape `apps/api` exists for. A separate service would mean a
new container, new docker-compose entry, new health check, new TLS
route — all overhead for a feature that piggybacks on infrastructure
that already exists in apps/api (auth middleware, credit middleware,
shared-hono error handling, the structured logger).

## Data model

Two Dexie tables, both follow the standard module pattern.

### `whoGames`

```typescript
interface LocalWhoGame {
  // Plaintext (used by queries / sort / filter)
  id: string;                // uuid, PK
  userId: string;            // stamped by Dexie hook
  characterId: number;       // 1..N — server-side lookup key
  deckId: 'historical' | 'women' | 'antiquity' | 'inventors' | ...;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'playing' | 'won' | 'surrendered';
  startedAt: string;         // ISO
  finishedAt: string | null;
  messageCount: number;      // denormalized for ListView sort
  hintsUsed: number;

  // Encrypted on flip
  revealedName: string | null;   // null while playing, the actual
                                 // historical name once won
  notes: string;                 // optional user notes after the
                                 // game ends ("guessed in 4!")
}
```

### `whoMessages`

```typescript
interface LocalWhoMessage {
  // Plaintext
  id: string;
  gameId: string;            // FK to whoGames
  userId: string;            // hook
  sender: 'user' | 'npc';
  createdAt: string;

  // Encrypted on flip
  content: string;
}
```

### Encryption registry entry

Add to `apps/mana/apps/web/src/lib/data/crypto/registry.ts`:

```typescript
// ─── Who (LLM character guessing game) ─────────────────────
// Conversation content + the revealed answer count as user-typed
// content; everything else stays plaintext for sort/filter.
whoGames:    { enabled: true, fields: ['revealedName', 'notes'] },
whoMessages: { enabled: true, fields: ['content'] },
```

This follows the chat module's pattern exactly — plaintext IDs,
foreign keys, timestamps, sender enum; encrypted free-form content.

## Backend endpoint contract

### `POST /api/v1/who/chat`

```jsonc
// Request
{
  "gameId": "uuid",          // for credit attribution + audit log
  "characterId": 7,          // server resolves to personality
  "message": "What did you build?",
  "history": [
    { "sender": "user", "content": "Hi who are you?" },
    { "sender": "npc", "content": "Greetings, traveler..." }
  ]
}

// Response (200)
{
  "reply": "I have built many things, but my most famous...",
  "identityRevealed": false
}

// Response (200, win)
{
  "reply": "Yes! You found me. I am Johannes Gutenberg.",
  "identityRevealed": true,
  "characterName": "Johannes Gutenberg"  // only present on reveal
}

// Errors
//   400 invalid input
//   402 insufficient credits
//   404 unknown characterId
//   429 rate limited (delegated to apps/api global middleware)
//   502 mana-llm failure
```

The frontend never asks "what's the name" — it only learns the name
when `identityRevealed: true` arrives. That's the moment the local
`LocalWhoGame.revealedName` gets written.

### `GET /api/v1/who/decks`

```jsonc
// Response — public deck catalogue, no names
{
  "decks": [
    {
      "id": "historical",
      "name": "Historisch (Standard)",
      "description": "26 berühmte historische Persönlichkeiten",
      "characterCount": 26,
      "categories": ["Erfinder", "Wissenschaftler", "Künstler"],
      "difficulty": "medium"
    },
    {
      "id": "women",
      "name": "Frauen der Geschichte",
      "description": "...",
      "characterCount": 12,
      "categories": ["Wissenschaftlerinnen", "Künstlerinnen", "Herrscherinnen"],
      "difficulty": "medium"
    }
    // ... more decks
  ]
}
```

This is what `DeckPicker.svelte` calls on mount. It is intentionally
zero-auth-info — a guest user can browse the decks before signing
in. (The actual play call is auth-gated.)

## Credits

Each user message → one mana-llm completion → cost via the existing
`@mana/shared-hono/credits` helpers, same shape as `chat/routes.ts`:

```typescript
const cost = isLocal ? 0.1 : 5;
const v = await validateCredits(userId, 'AI_WHO', cost);
if (!v.hasCredits) return c.json({ error: 'Insufficient credits', required: cost }, 402);
// ... call mana-llm ...
await consumeCredits(userId, 'AI_WHO', cost, `Who: deck=${deckId}`);
```

The operation type `AI_WHO` is registered alongside the existing
`AI_CHAT`, `AI_RESEARCH`, etc. in the credits service config. The
deck/character name is **not** logged in the transaction message
(it would leak which character a user is playing right now).

## Win-detection: the `[IDENTITY_REVEALED]` trick

Lifted directly from the original whopixels server. The system
prompt instructs the LLM:

> Du bist ${name}. Dein Gegenüber versucht zu erraten wer du bist.
> Gib Hinweise auf deine Identität als ${name}, aber sage nicht
> direkt "Ich bin ${name}". Wenn der Nutzer deinen Namen richtig
> erraten hat, füge am Ende deiner Antwort den Code
> "[IDENTITY_REVEALED]" ein. Dieser Code sollte nur erscheinen,
> wenn der Name korrekt erraten wurde.

After the LLM responds, the server checks for the sentinel string,
strips it from the visible reply, and sets `identityRevealed: true`.
The frontend then transitions the game to the won state and reveals
the name.

It's a clever low-overhead approach: no separate "is this a guess"
classifier call, no fuzzy name matching, no second LLM round-trip.
The same model that's roleplaying the character also acts as the
judge of whether the name was guessed — and it's surprisingly
reliable because LLMs are good at noticing their own name.

The known failure mode (LLM forgets to emit the sentinel even
though the user clearly said the right name) is mitigated by the
frontend offering an explicit "I think you are X" submit button as
an escape hatch — that path does a single deterministic comparison
on the server with the canonical name. Tracked as a follow-up if
the implicit detection turns out flaky in practice.

## Decks (Phase A includes 4)

Initial decks shipping with v1:

| Deck | Source | ~Count | Difficulty |
|------|--------|--------|------------|
| `historical` | Original whopixels NPCs | 26 | medium |
| `women` | Curated subset of historical + new additions | ~15 | medium |
| `antiquity` | New: Sokrates, Platon, Aristoteles, Cicero, Hypatia, Cleopatra, Konfuzius, Buddha, Lao Tse, Sun Tsu, Caesar, ... | ~12 | hard |
| `inventors` | Subset of historical + new (more obscure inventors) | ~15 | easy/medium |

Totals: ~70 character entries shipping in `apps/api/src/modules/who/data/characters.ts`. The original 26 are kept verbatim (the personality strings are good and were tested in production), the 44 additions are written fresh in the same style.

## Routing

```
apps/mana/apps/web/src/routes/(app)/who/
├── +page.svelte           # ListView wrapper (past games + "new game" CTA)
└── play/
    └── [gameId]/
        └── +page.svelte   # PlayView wrapper for an active game
```

The deck picker is rendered as an in-page modal/overlay rather than
its own route — same pattern as the chat module's "new conversation"
flow.

`mana-apps.ts` registry entry:

```typescript
{
  id: 'who',
  name: 'Who',
  description: { de: 'Errate wer ich bin', en: 'Guess who I am' },
  longDescription: {
    de: 'Chatte mit einer historischen Persönlichkeit. Eine KI verkörpert sie ohne den Namen zu verraten — du musst durch geschickte Fragen herausfinden, mit wem du sprichst.',
    en: 'Chat with a historical figure. An AI roleplays them without revealing their name — you have to figure out who you are talking to.'
  },
  icon: APP_ICONS.who,         // new icon to add
  color: '#a855f7',            // purple — distinct from other modules
  comingSoon: false,
  status: 'beta',
  requiredTier: 'beta'
}
```

## Build order

Loose work plan, ~20–26h estimated:

1. **Backend skeleton (~4h)**
   - `apps/api/src/modules/who/routes.ts` with `POST /chat` + `GET /decks`
   - `apps/api/src/modules/who/data/characters.ts` — port the 26 originals + 44 new
   - Register in `apps/api/src/index.ts`
   - Add `AI_WHO` operation to mana-credits config
   - Smoke test with curl

2. **Module scaffolding (~3h)**
   - `module.config.ts`, `collections.ts`, `queries.ts`, `types.ts`
   - Register in `module-registry.ts`
   - Encryption registry entry
   - `mana-apps.ts` registry entry + new `who` icon (placeholder SVG OK)
   - Route stub `/(app)/who/+page.svelte` that just says "coming soon" — verifies registration end-to-end

3. **Game store (~3h)**
   - `stores/games.svelte.ts` — `startGame`, `sendMessage`, `surrender`, `replay`
   - Optimistic insert of user messages, reconciled on server reply
   - Win-state transition + `revealedName` write

4. **Game UI (~6–8h)**
   - `views/DeckPicker.svelte` — calls `/api/v1/who/decks`, lets the user pick
   - `views/PlayView.svelte` — chat scrollback, input box, message bubbles, win banner, hint button (uses one hint, costs nothing)
   - `views/ResultView.svelte` — final score, "share" button, "play again with same deck" CTA
   - `ListView.svelte` — past games table sorted by recency, status icons

5. **Stats + polish (~2h)**
   - Per-deck stats: games played, win rate, average messages to win
   - Streak counter (consecutive days played)

6. **Tests (~2–3h)**
   - Unit: store mutations against fake-indexeddb
   - Backend: at least one Hono test that the chat endpoint enforces auth + credits + sentinel detection
   - Manual QA: full game loop against local stack

7. **Cleanup (~1h)**
   - Delete `games/whopixels/` directory
   - Remove `whopixels` container from `docker-compose.macmini.yml`
   - Mark `whopixels` cloudflared route for archive
   - Audit doc update: close item #29's "whopixels" question

## Open questions for review

1. **Module name `who`** — short and free, but maybe too generic. Alternatives: `wisdom`, `personae`, `whois`, `riddle`. Sticking with `who` unless reviewer prefers another.

2. **Streaming the LLM reply via SSE** — chat module has both sync and stream variants. For who, SSE would feel snappier but adds complexity. Recommendation: ship sync-only in v1, add SSE in a follow-up if the latency feels bad in practice.

3. **`hintsUsed` counter and the hint button** — keep or drop? The original NPC data has a `hint` field per character. A hint button could either (a) reveal the hint at no cost (cheap unlock for stuck players) or (b) cost one credit / one hint per game. Recommendation: keep it free, increment `hintsUsed` so the leaderboard (Phase B) can rank "won without hints" higher.

4. **Daily challenge in Phase A?** — proposed for Phase B but it's a small enough addition that it could fit in Phase A. Adds a `dailyChallenge` table on the **server side** (must be central — every user gets the same character per day), one cron job, one extra endpoint. ~6h additional. Recommendation: defer to Phase B unless reviewer wants a tighter Wordle-style hook from day one.

5. **Cleanup of `games/whopixels/` and the container** — block this on the new module landing in production and at least one full week of usage data, or do it in the same PR? Recommendation: same PR. The two systems are independent, the new one supersedes the old, no migration needed (whopixels has no persisted user data — sessions were in-memory only).

6. **`mana-events` integration** — when a user wins a game, emit a `who.identity_revealed` event so other features (a future feed, achievements, etc.) can react. Cheap to add now, expensive to backfill later. Recommendation: emit the event from the backend in v1, even if no consumer exists yet.

## Risks

- **LLM reliability for the sentinel detection.** The `[IDENTITY_REVEALED]` trick works most of the time but is inherently model-dependent. Mitigation: explicit "I guess: ___" submit button as fallback path with deterministic name comparison server-side.
- **Personality leak via observed responses.** A motivated user could log many chats with the same character and reverse-engineer the personality string from response patterns. This is fundamental to the format and not really mitigatable; the server-side hiding of the personality just raises the bar above casual cheating.
- **Cost tail.** Each game is 5–20 LLM completions; players who get stuck can run up costs fast. Mitigation: the credits middleware already exists and gates each call. A founder with unlimited credits is the riskiest case — flag this in launch monitoring.
- **i18n.** The original personality strings are German. New decks should be written in DE first then translated, OR the LLM can be told to respond in the user's language regardless of system-prompt language. Recommendation: keep personalities in DE, instruct the LLM "respond in the language the user writes in." Tested in chat module already, works fine.

## What this RFC is NOT

- Not the full Phase B (Daily Challenge, Leaderboard, social) — that's a follow-up after the v1 lands and we have real usage data
- Not the generative variant (Phase C / Option 3) — too speculative to design before knowing if the hardcoded version flies
- Not a pixel-art editor — despite the legacy `whopixels` README claiming so

---

**Review checklist for the user:**

- [ ] Module name `who` OK or pick alternative
- [ ] 4 decks for v1 (historical / women / antiquity / inventors) — drop or add any
- [ ] Sync-only in v1 (no SSE) — accept or push back
- [ ] Hint button free, count tracked — accept or change pricing
- [ ] Daily challenge deferred to Phase B — accept or pull into Phase A
- [ ] whopixels deletion in same PR as the new module — accept or split

Once the checklist is signed off, I implement steps 1–7 in build order
and ship in a single feature branch.
