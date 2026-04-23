# Persona Visual Suite

Playwright-driven visual regression tests that log in as each of the **M2 personas**, navigate through the modules the persona uses, and diff screenshots against committed baselines. Detects UI regressions before real users do.

**Plan:** [`docs/plans/mana-mcp-and-personas.md`](../../docs/plans/mana-mcp-and-personas.md) (M5)

## Prerequisites

The suite assumes the full local stack is already running and **seeded with persona data**. It does *not* auto-start anything — a silent "all green" against an empty seed would hide regressions, not find them.

```bash
# 1. Stack up + seeded
pnpm docker:up
cd services/mana-auth && bun run db:push
pnpm dev:auth            # mana-auth on 3001
pnpm dev:sync            # mana-sync on 3050
pnpm mana:dev            # web app on 5173 — the suite hits this

# 2. Seed the 10 catalog personas
export MANA_ADMIN_JWT=…
export PERSONA_SEED_SECRET=…    # same value the suite uses below
pnpm seed:personas

# 3. Optional but recommended: run the persona-runner once so each
#    persona has real content. Empty accounts make empty baselines.
pnpm --filter @mana/mcp-service dev         # :3069
pnpm --filter @mana/persona-runner dev      # :3070
export MANA_SERVICE_KEY=…
export ANTHROPIC_API_KEY=…
curl -X POST localhost:3070/diag/tick
```

## Running

```bash
cd tests/personas

# First run — captures baselines (or diffs against existing ones):
pnpm test

# Accept current render as new baseline (after intentional UI changes):
pnpm test:update

# View the HTML report with diff visualisations:
pnpm report
```

## Environment

| Var | Default | Purpose |
|---|---|---|
| `PERSONAS_AUTH_URL` | `http://localhost:3001` | mana-auth for API login |
| `PERSONAS_BASE_URL` | `http://localhost:5173` | web app the browser loads |
| `PERSONAS_COOKIE_DOMAIN` | derived from `PERSONAS_BASE_URL` host | Where better-auth's cookie lands |
| `PERSONA_SEED_SECRET` | dev fallback | MUST match `scripts/personas/password.ts` and the runner |

## Architecture

```
┌──────────────────────────────────────────────┐
│  tests/personas/fixtures/persona-auth.ts     │
│  ├── personaPassword(email) — HMAC-SHA256    │
│  ├── loginAndGetCookies — POST /auth/login   │
│  └── test.use({ personaKey: 'anna' })        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
   BrowserContext.addCookies(better-auth session)
                       │
                       ▼
              page.goto('/')  — logged in!
                       │
                       ▼
    flow-specific assertions + toHaveScreenshot()
                       │
                       ▼
   ./__snapshots__/<spec>/<img>-<project>.png
```

## Adding a flow

Copy `flows/home.spec.ts` to `flows/<module>.spec.ts`, change:

- `test.use({ personaKey: '…' })` to the right persona
- the `goto('/')` path
- the screenshot filename

Run `pnpm test:update` once to capture the baseline, commit the new PNG, done. CI diffs on every future run.

## Design notes

- **No webServer in config**: the suite runs against the *running* stack, not a hermetic one. That's the point — we want to catch regressions in the app that real users would see, not just the test build. If the stack is down, all tests fail loud with a descriptive login error.
- **API-login, not form-login**: the login UI is tested elsewhere; re-driving it per persona × per spec would add minutes to every run with no signal.
- **Two viewports, one browser**: `desktop` (1440×900 Chrome) + `mobile` (Pixel 5). Enough to catch most layout regressions without quadrupling the baseline count. Add `iPad` / `webkit` after the suite has settled.
- **Diff threshold 0.2%**: tight enough to catch real regressions, loose enough to ignore antialiasing noise. Tune if false positives emerge.
- **`animations: 'disabled'`**: Playwright pauses CSS animations for the screenshot, so transitions don't bleed into diffs.
- **Live timestamps hidden**: any element with `data-testid="live-time"` gets `visibility: hidden` before the screenshot. Add that testid to clock/relative-time components.
