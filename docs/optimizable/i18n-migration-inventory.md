# i18n Migration Inventory

**Status as of 2026-04-22.** Run `pnpm run audit:i18n-coverage` for current numbers.

## The gap

The unified Mana web app has `@mana/shared-i18n` + `svelte-i18n`
**fully wired** — per-module translation files live under
`apps/mana/apps/web/src/lib/i18n/locales/{module}/{de,en,it,fr,es}.json`
for 35 modules, with ~3500 lines of German and matching English /
Italian / French / Spanish. The infrastructure is done.

What's missing is the **usage**: most module `.svelte` templates
hardcode German strings like `"Abbrechen"`, `"+ Neues Mood"`,
`"Keine Daten"` instead of calling `{$_('module.key')}`.

Scanning `lib/modules/**/*.svelte`:

- **FULL** (4 modules) — all files import `$_()` from svelte-i18n
- **PARTIAL** (9 modules) — mixed usage
- **NONE** (65 modules) — German hardcoded throughout

## Why not auto-migrate?

String migration is per-site careful work:
- pick a key name (or reuse existing one from the locale file)
- pick the German source text (may differ slightly from existing keys)
- add key to all 5 language files (de/en/it/fr/es)
- replace in template, test UI visually
- tests covering copy may break

It's not a mechanical codemod. Each module is a session of its own.

## Priorities

Rank by `keyword-hits × user-impact`. Run the audit for current numbers:

```bash
pnpm run audit:i18n-coverage --summary --top 20
```

Top offenders (2026-04-22 snapshot):

| Rank | Module | Hits | Files | Locale? | Notes |
|---|---|---|---|---|---|
| 1 | broadcast | 26 | 10 | ✗ | Content broadcast compose + recipient UI |
| 2 | articles | 24 | 16 | ✗ | Reader view, highlights, filter labels |
| 3 | events | 23 | 12 | ✗ | RSVP, guest list, discovery |
| 4 | invoices | 22 | 9 | ✗ | Business-critical: line items, payment states |
| 5 | quiz | 20 | 3 | ✗ | Edit + play flows, question types |
| 6 | stretch | 20 | 6 | ✗ | Session flows, reminders, routines |
| 7 | library | 19 | 11 | ✗ | Book/media tracker: status, filtering |
| 8 | profile | 17 | 4 | ✓ | Interview flow, context overview |
| 9 | skilltree | 15 | 11 | ✓ | PARTIAL — modals done, ListView hardcoded |
| 10 | calendar | 14 | 15 | ✓ | PARTIAL — EventForm done, ListView labels |

**Already FULL:** `body`, `todo`, `times`, and the modules whose
keyword count is zero (either trivially small templates or consistent
use of `$_()`).

## Recommended workflow per module

1. **If no locale file exists** — run the skilltree/moodlit layout as
   a template. Start with: `nav.*`, `common.{save,cancel,delete,confirm}`,
   `list.{empty,count,newItem}`, `create.{title,save,namePlaceholder}`,
   plus module-specific vocabulary.
2. **Extract German strings** into `de.json` — keep them verbatim so
   existing copy doesn't regress.
3. **Translate to `en.json`** (required for sync across language
   switch). Keep `it/fr/es.json` with English fallbacks if translator
   not available.
4. **Replace in templates** — `import { _ } from 'svelte-i18n'` at the
   top, then `{$_('module.key')}` inline. For attributes:
   `placeholder={$_('module.namePlaceholder')}`.
5. **Update `i18n/index.ts`** — add the module to `registerLocale()` if
   it isn't already listed (broadcast/articles/events/invoices/quiz/
   stretch/library/wishes/guides/habits/dreams/firsts/companion/
   ai-missions all need entries).
6. **Re-run the audit** — `pnpm run audit:i18n-coverage --summary` —
   expect the module to move from NONE → FULL.
7. **Manual browser test** — the audit is pattern-based; visual QA
   catches anything it missed.

## Prevention (future work)

The audit currently reports only — it doesn't fail CI. A future step
could graduate it to a gate that:
- blocks PRs that *add* hardcoded German to ListViews already migrated
- continues to tolerate existing debt until it's cleared

Until then: `audit:i18n-coverage` is the contract.
