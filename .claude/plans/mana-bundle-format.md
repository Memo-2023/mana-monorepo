# Mana Bundle Format

**Status:** Planned (not started)
**Priority:** Low — implement after local-first migration is complete
**Scope:** New `@manacore/bundle` package + ManaCore import UI + optional `.manapkg` tooling

---

## Vision

A portable, shareable file format (`.mana` / `.manapkg`) that can be opened in ManaCore and:

- Creates data across multiple apps (Todo, Calendar, Contacts, Storage, ...)
- Configures dashboard layouts
- Optionally releases content sequentially (day-by-day courses, onboarding flows)

Primary use cases:

- Onboarding courses (e.g. GTD setup, productivity starter kit)
- Cross-app templates shared between users
- App-internal onboarding when a user first activates an app
- Future: third-party ecosystem (coaches, companies publishing setups)

---

## File Format

### Simple: `.mana` (JSON)

For small bundles without binary assets.

```json
{
  "version": "1.0",
  "type": "blueprint",
  "meta": {
    "name": "GTD Onboarding",
    "description": "Startet dich mit Todo, Kalender & Kontakten",
    "author": "mana.how",
    "createdAt": "2026-03-31"
  },
  "variables": {
    "userName": { "type": "string", "prompt": "Wie heißt du?" },
    "startDate": { "type": "date", "default": "today" }
  },
  "steps": [ ... ],
  "dashboard": { ... }
}
```

### Rich: `.manapkg` (ZIP archive)

For bundles with images, PDFs, audio files.

```
onboarding.manapkg
├── manifest.json       # name, version, author, asset index
├── blueprint.json      # full step/data definition
└── assets/
    ├── avatar.png
    ├── cheatsheet.pdf
    └── day1-banner.jpg
```

Assets referenced in blueprint as `asset://avatar.png` → resolved to MinIO URLs on import.

---

## Data Model

### Step Structure

Each step defines what data to create and when to release it:

```json
{
	"id": "day-1",
	"label": "Tag 1: Grundlagen",
	"releaseOn": "import",
	"data": {
		"todo": {
			"projects": [{ "id": "onboarding", "name": "Onboarding" }],
			"tasks": [{ "title": "App-Tour abschließen", "projectId": "onboarding", "dueDate": "+0d" }]
		},
		"calendar": {
			"events": [{ "title": "Kick-off", "startDate": "+0d" }]
		},
		"contacts": {
			"contacts": [
				{ "name": "Mana Support", "email": "hi@mana.how", "photoAsset": "asset://avatar.png" }
			]
		}
	}
}
```

### Release Triggers

Three modes, combinable via `any` / `all`:

```json
// Time-based (relative to importDate)
"releaseOn": { "trigger": "time", "after": "+1d" }

// Completion-based (task done, event attended, etc.)
"releaseOn": { "trigger": "task:completed", "taskId": "$day-1.todo.tasks[0].id" }

// Combination (whichever comes first)
"releaseOn": {
  "any": [
    { "trigger": "time", "after": "+1d" },
    { "trigger": "step-completed", "stepId": "day-1" }
  ]
}
```

Supported trigger types (initial set):

- `"import"` — immediately on bundle import
- `"time"` + `after: "+Nd"` — N days after import
- `"step-completed"` + `stepId` — after another step's data has been applied
- `"task:completed"` + `taskId` — when a specific task is checked off

### Dashboard Configuration

```json
"dashboard": {
  "layout": [
    { "type": "tasks-today",       "size": "medium", "position": { "x": 0, "y": 0 } },
    { "type": "calendar-upcoming", "size": "medium", "position": { "x": 4, "y": 0 } },
    { "type": "bundle-progress",   "size": "small",  "position": { "x": 8, "y": 0 } }
  ]
}
```

---

## Binary / Asset Handling

| Asset size      | Strategy                                           |
| --------------- | -------------------------------------------------- |
| Small (< 50 KB) | Base64 inline in blueprint.json                    |
| Medium / Large  | `.manapkg` ZIP with `assets/` folder               |
| Hosted assets   | External URL (`https://...`), downloaded on import |

On import: assets are uploaded to MinIO → URL stored in record. Bundle stays self-contained if `.manapkg`.

---

## ManaCore State: `bundles` Collection

A new collection in the ManaCore local-store tracks installed bundles and their progress:

```typescript
interface BundleRecord {
	id: string;
	name: string;
	importedAt: string; // ISO date
	anchor: string; // = importedAt, base for relative dates
	status: 'active' | 'completed' | 'paused';
	appliedSteps: string[]; // step IDs already applied
	pendingSteps: PendingStep[];
}

interface PendingStep {
	stepId: string;
	label: string;
	releaseAt?: string; // resolved ISO datetime (for time-triggers)
	trigger?: object; // original trigger definition (for reactive triggers)
	applied: boolean;
}
```

---

## Implementation Plan

### Phase 1: Core Format + Import (MVP)

1. **`packages/bundle/`** — new package `@manacore/bundle`
   - `schema.ts` — TypeScript types for `.mana` format (Blueprint, Step, Trigger, DashboardConfig)
   - `parser.ts` — parse & validate `.mana` JSON or `.manapkg` ZIP
   - `resolver.ts` — resolve variables, relative dates (`+Nd`), asset references
   - `importer.ts` — write data into app collections via cross-app-stores write API

2. **ManaCore: `bundles` collection** — add to `manacore-store.ts`

3. **ManaCore: Import UI**
   - Drag & drop or file picker on dashboard or settings page
   - Variable prompt dialog (if `variables` defined)
   - Preview: shows what will be created across which apps
   - Confirmation → apply step `releaseOn: "import"` immediately

4. **ManaCore: `bundle-progress` Dashboard Widget**
   - Shows bundle name, progress bar, current/next step label
   - Lists completed ✅ / active ▶ / locked 🔒 steps

### Phase 2: Sequential Release

5. **Bundle Runner** — background check on app start
   - Query `bundles` collection for `status: 'active'`
   - For each pending step: check if `releaseAt <= now` → apply & mark applied
   - Uses existing `cross-app-stores` write path

6. **Reactive Triggers** (task:completed, step-completed)
   - Subscribe via `liveQuery` on relevant collections
   - Trigger condition check → apply next step

### Phase 3: Asset Support

7. **`.manapkg` ZIP parsing** — use a lightweight JS ZIP lib (e.g. `fflate`)
8. **Asset upload to MinIO** on import via `@manacore/shared-storage`
9. **External URL download** with offline fallback (queue for later)

### Phase 4: Tooling (optional, later)

10. **Bundle authoring CLI** — `mana-bundle create`, `mana-bundle validate`, `mana-bundle pack`
11. **`manacore://` deep link + QR** — open bundle from URL, encode small bundles in QR

---

## Key Files (when implementing)

| File                                                                      | Purpose                         |
| ------------------------------------------------------------------------- | ------------------------------- |
| `packages/bundle/src/schema.ts`                                           | TypeScript types for the format |
| `packages/bundle/src/importer.ts`                                         | Write data into app collections |
| `apps/manacore/apps/web/src/lib/data/manacore-store.ts`                   | Add `bundles` collection        |
| `apps/manacore/apps/web/src/lib/data/cross-app-stores.ts`                 | Extend write API if needed      |
| `apps/manacore/apps/web/src/routes/(app)/+page.svelte`                    | Import UI entry point           |
| `apps/manacore/apps/web/src/lib/components/widgets/BundleProgress.svelte` | Dashboard widget                |

---

## Open Questions (resolve when starting)

- Should bundles be synced via mana-sync so they appear on all devices? (probably yes)
- Max asset size limit for `.manapkg`?
- Should there be a way to "uninstall" a bundle (delete created data)?
- Do we need bundle signing/trust for third-party bundles?
