# Test Health

**Status 2026-04-22.** Run `pnpm run audit:test-coverage` for live numbers.

## Current state

- **34/653 tests currently fail.** Related to in-flight
  spaces-foundation migration work (app-registry, api-keys, base-client,
  crypto record-helpers). Hard coverage thresholds aren't enforceable
  until the suite is green.
- **File-level "coverage" is 2.6%.** 22 test files vs 857 source files
  (.svelte + .ts). 66 of 78 modules have zero tests.
- **12 modules have ≥1 test file.** Hotspots (todo, times, body, a
  handful of critical infra) are partially covered; long tail is not.

## Why file presence, not line coverage

Running `vitest --coverage` requires the suite to pass. Until the 34
failing tests are fixed, coverage numbers are undefined. In the
meantime, "does this module have *any* automated regression
protection?" is a useful signal for prioritising the next session.

## Top untested modules (by source file count)

| Module | Source files | Priority |
|---|---|---|
| times | 32 | HIGH — time-tracking logic, billing-adjacent |
| articles | 29 | HIGH — reader pipeline, bookmarklet, parsing |
| events | 27 | MED — RSVP / calendar interactions |
| inventory | 20 | MED — user-owned item schema |
| skilltree | 20 | MED — XP / level math |
| library | 19 | LOW — simple CRUD |
| photos | 17 | MED — upload / storage paths |
| wetter | 17 | LOW |
| calc | 16 | MED — arithmetic correctness |
| meditate, news, quotes, cards, core, moodlit | 13–16 each | mixed |

## Prevention path

1. **Fix the 34 failing tests first** — they're noise blocking any real
   coverage work.
2. **Run `vitest --coverage`** — capture a baseline per module.
3. **Add thresholds to `vite.config.ts` `test.coverage.thresholds`**
   — start lax (50% for modules with tests, ignore untested), tighten
   over time.
4. **Make `pnpm run test:coverage` part of `validate:all`** — only
   after (1) is done.

For now: `audit:test-coverage` is the contract.
