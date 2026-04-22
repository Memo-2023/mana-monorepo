# Manual / Smoke Test Backlog

Single source of truth for "features that are **code-complete + unit-tested** but still need a human click-through before release." Distinct from:

- [`test-health.md`](test-health.md) — automated test suite health
- [`docs/TESTING_DEPLOYMENT_CHECKLIST.md`](../TESTING_DEPLOYMENT_CHECKLIST.md) — CI/CD system pre-deploy
- [`docs/plans/shared-space-smoketest.md`](../plans/shared-space-smoketest.md) — detailed shared-space walkthrough (linked below)

An entry lives here as long as the feature hasn't been driven through a real browser / device / account end-to-end. When the smoke test has run green once, delete the entry.

## Format

Each entry carries:
- **Area** — feature surface
- **Why it's here** — what unit tests do *not* cover
- **Steps** — inline if short; a link to a dedicated walkthrough if long
- **Shipped?** — commit(s) that shipped the code the test would exercise
- **Priority** — `🔴 release blocker` / `🟠 important` / `🟡 nice to have`

---

## Open

### Data Export v2 — end-to-end roundtrip in a real browser

- **Priority:** 🟠 important
- **Shipped:** `fd1ea4707` (feature), `8c3d6e7bb` (test + cross-account adoption fix)
- **Why it's here:** `format.test.ts` (10) + `roundtrip.test.ts` (6) cover the pipeline with fake-indexeddb + pass-through crypto. Unit coverage is blind to: real AES-GCM through Web Crypto at browser speed, the File-download + re-upload path, Blob memory behaviour at multi-MB sizes, the passphrase-prompt modal flow, and the MyData settings-section wiring.
- **Steps:**
  1. `pnpm run mana:dev`. Log in, create a handful of notes + tasks + events.
  2. Settings → Meine Daten → export (full, no passphrase). Download the `.mana` file.
  3. Inspect the archive (`unzip -l mana-full-*.mana`) — expect `manifest.json` + `data/*.jsonl`.
  4. DevTools → Application → Storage → "Clear site data" on `localhost:5173`. Reload. Log in again.
  5. Settings → Meine Daten → import → pick the `.mana` file. Check progress bar ticks, summary lists tables + row counts.
  6. Open each module, confirm rows are back and readable (encrypted fields decrypt cleanly).
  7. Repeat 1–6 with **passphrase on** — export with passphrase, expect `data.sealed` entry in the zip, re-import must prompt for the passphrase. Try once with the wrong passphrase, expect the friendly "Passphrase stimmt nicht" message, not a crash.
  8. **Cross-account**: export from account A, log out, log in as account B (or a fresh signup), import. Confirm rows adopted by B (spaceId starts with `_personal:<B-userId>`, not A's). Verify in DevTools → IndexedDB.

### Shared Space — two-user smoke test

- **Priority:** 🟠 important
- **Shipped:** spaces-foundation 15-commit block (2026-04-20, see `project_spaces_foundation.md` memory)
- **Why it's here:** the data-layer + RLS + invite-flow integration can only be verified with two real sessions across two browser profiles.
- **Steps:** full walkthrough at [`docs/plans/shared-space-smoketest.md`](../plans/shared-space-smoketest.md) — create Family Space, invite, accept, verify cross-user sync on calendar + recipes.

### Articles bookmarklet — consent-walled sites

- **Priority:** 🟡 nice to have
- **Shipped:** articles M1–M9 (see `project_news_research_module.md` / plan at `docs/plans/articles-module.md`)
- **Why it's here:** the Weg-2 browser-HTML bookmarklet was built to route around server-side fetchers that hit a consent dialog (Golem, Spiegel, Zeit). No automation can exercise the real consent-wall detection path.
- **Steps:**
  1. Install the bookmarklet (Settings → Articles, drag to bookmarks bar).
  2. Navigate to a known consent-walled article (golem.de is the reference case — the original bug report).
  3. Accept the consent banner in the source tab, then click the bookmarklet.
  4. Expect a new tab that auto-saves the article; no extra "save to Leseliste" click required.
  5. Verify the saved article has readable body + title in `/articles`.

### Articles — PWA share-target

- **Priority:** 🟡 nice to have
- **Shipped:** share-target configured in `vite.config.ts` (routes to `/articles/add` with `?url` + `?text` + `?title`)
- **Why it's here:** only works on an installed PWA; dev-mode SW is disabled.
- **Steps:**
  1. `pnpm build && pnpm preview`, install the PWA (Chrome "install Mana" prompt on desktop, or Android "add to home screen").
  2. Share a URL from the OS share sheet (Chrome Android, WhatsApp, Mail) → expect Mana to appear and land on `/articles/add` with the URL pre-filled in the form.

---

## Recently closed

*(Move entries here with the date they were verified, prune after one release.)*

_None yet — this file was introduced 2026-04-22._

## How to add an entry

When you ship a feature with unit tests but no browser / device click-through, add a new `### <feature>` section under "Open" using the format above. Keep steps reproducible: assume a fresh clone and `pnpm docker:up && pnpm run mana:dev`. If the steps cross 20 lines, split them into a dedicated walkthrough file under `docs/plans/` and link from here.
