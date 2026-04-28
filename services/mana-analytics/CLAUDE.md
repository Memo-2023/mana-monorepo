# mana-analytics

Public-Community-Feedback-Hub. Backend für `@mana/feedback`. Hostet
sowohl die auth-required Submission/React/Admin-Surface als auch die
anonymous Public-Mirror-Endpoints für `feedback.mana.how` und
`mana.how/feedback`.

## Port: 3064 (prod port via cloudflared tunnel: `feedback.mana.how`)

## API Endpoints

### Authenticated (`/api/v1/feedback/*`, JWT via JWKS from mana-auth)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/feedback` | Submit feedback (top-level wish or reply via `parentId`). Auto-titles via mana-llm if no `title` given. Stamps `display_hash` + `display_name`. Triggers fire-and-forget +5-Credit-grant via mana-credits when ≥20 chars + not founder + within 24h rate-limit |
| GET | `/api/v1/feedback/public` | Auth-enriched feed: each item carries `myReactions[]` for highlight + `realName` if author opted in |
| GET | `/api/v1/feedback/me` | Items the user authored (across all isPublic states) |
| GET | `/api/v1/feedback/me/reacted` | Items the user reacted on, redacted to PublicFeedbackItem (excludes own) |
| GET | `/api/v1/feedback/me/notifications?unread_only=true&limit=N` | Inbox |
| POST | `/api/v1/feedback/me/notifications/:id/read` | Mark single notification read (scoped to caller) |
| POST | `/api/v1/feedback/me/notifications/read-all` | Mark all caller's unread notifications read |
| GET | `/api/v1/feedback/:id/replies` | 1-level threading replies |
| POST | `/api/v1/feedback/:id/react` | Toggle a single emoji reaction (👍 ❤️ 🚀 🤔 🎉). Increments author karma on +1 / decrements on toggle-off (+0 for self-react) |
| DELETE | `/api/v1/feedback/:id` | Delete own feedback |
| GET | `/api/v1/feedback/admin?…` | List ALL feedback incl. private (founder/admin role only) |
| PATCH | `/api/v1/feedback/admin/:id` | Update status / adminResponse / isPublic. Status-transition triggers: notify-author-always, notify-reactioners-on-completed, +500 + +25 credit-grants on completed |

### Anonymous Public (`/api/v1/public/feedback/*`, NO auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/public/feedback/feed?…` | Top-level public items, redacted (no userId, no realName even if opted-in) |
| GET | `/api/v1/public/feedback/eule/:hash` | Eulen-Profil: alle Posts unter dem display_hash + Karma |
| GET | `/api/v1/public/feedback/:id` | Single item + replies, redacted |

## Database

Lives in `mana_platform.feedback` (alongside the other services' schemas).

Tables:
- `user_feedback` — top-level wishes + replies (parent_id), with cached `reactions jsonb` + `score int` for sort
- `feedback_reactions` — Slack-pattern (feedback_id, user_id, emoji) unique
- `feedback_notifications` — Per-user inbox, ON DELETE CASCADE on user_feedback
- `feedback_grant_log` — Sliding-window rate-limit log (10/user/24h)

The `feedback_category` + `feedback_status` enums live in `public` schema (Drizzle's pgEnum quirk — see repo memory). `auth.users` is JOINed cross-schema for karma + Klarname-opt-in (read-only — mana-auth owns those columns).

Migrations are hand-authored under `drizzle/`:
- `0001_align-feedback-enums.sql` — Status rename + 'praise' + 'onboarding-wish'
- `0002_public-community-foundation.sql` — Pseudonym + reactions + score
- `0003_grant_log_drop_vote_count.sql` — Rate-limit log + drop legacy
- `0004_feedback_notifications.sql` — Inbox table

Apply manually with `psql -f` before next `db:push` (drizzle-kit can't safely do enum-renames or cross-schema CASCADE drops).

## Environment Variables

```env
PORT=3064
DATABASE_URL=postgresql://...           # mana_platform
MANA_AUTH_URL=http://mana-auth:3001     # JWKS lookup
MANA_LLM_URL=http://mana-llm:3025       # auto-title generation
MANA_CREDITS_URL=http://mana-credits:3002 # internal grant calls (prod port; dev 3061)
MANA_SERVICE_KEY=...                    # X-Service-Key for /internal/credits/grant
FEEDBACK_PSEUDONYM_SECRET=...           # SHA256(userId+secret) → display_hash
FEEDBACK_FOUNDER_USER_IDS=…,…           # Comma-separated; bypass +5/+500 grants
CORS_ORIGINS=https://mana.how,https://feedback.mana.how
```

## Tests

```bash
# Unit-only (pseudonym, redact privacy-boundary, avatar). 16 tests, ~50ms.
bun test

# Full suite incl. DB-backed integration tests against local mana_platform.
# Cleans up via afterAll DELETE — userIds prefixed with `test-`.
pnpm test:integration

# Or with explicit DB:
TEST_DATABASE_URL=postgres://mana:devpassword@localhost:5432/mana_platform bun test
```

Integration tests live next to the service files (`*.integration.test.ts`).
They mock `globalThis.fetch` so calls to mana-credits are captured locally —
no need for that service to be running. The whole integration-suite is
`describe.skip`-gated on `TEST_DATABASE_URL` so a fresh checkout's
`bun test` doesn't fail without a Postgres.

## Reward Loop (Phase 3)

Quick reference for the credit + karma side-effects:

| Trigger | Effect |
|---|---|
| Top-level submission ≥20 chars, non-founder, under rate-limit | +5 Credits, log row in feedback_grant_log |
| Status transition (any) | Author-Notification enqueued |
| Status → 'completed' (fresh) | Author +500 Credits + Notification, each 👍/🚀-Reactioner +25 Credits + Notification (one per user, idempotent via referenceId) |
| AdminResponse edit | Author admin_response-Notification |
| User reacts on someone else's post | Author karma +1 |
| User unreacts | Author karma -1, floor-clamped at 0 |
| User reacts on own post | No karma change (self-promotion guard) |

See [`docs/plans/feedback-rewards-and-identity.md`](../../docs/plans/feedback-rewards-and-identity.md) for the full Phase-3 plan.
