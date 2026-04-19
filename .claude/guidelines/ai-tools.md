# AI Tools — Adding Tools to a Module

This guide documents **how to give the AI agent (Missions / Runner / Proposal inbox) the ability to read from or write to a module**. Every AI write goes through the Tool layer — there is no back-door to stores from the Runner.

## TL;DR

Adding a tool needs edits in **three files**:

1. **`packages/shared-ai/src/tools/schemas.ts`** — declare the tool in the canonical catalog
2. **`apps/mana/apps/web/src/lib/modules/{module}/tools.ts`** — implement `execute()`
3. **`apps/mana/apps/web/src/lib/data/tools/init.ts`** — register the module's array

Everything else (policy defaults, server-side planner list, proposable-tools derivation, drift guard) updates automatically.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ packages/shared-ai/src/tools/schemas.ts                 │
│   AI_TOOL_CATALOG  ← single source of truth              │
│   { name, module, description, defaultPolicy, params }   │
└──────────────┬───────────────────────────────┬───────────┘
               │                               │
    ┌──────────▼──────────────┐      ┌─────────▼──────────────┐
    │ Webapp                  │      │ Server (mana-ai)        │
    │  - policy.ts derives    │      │  - planner prompt        │
    │    DEFAULT_AI_POLICY    │      │  - drift guard throws    │
    │  - executor validates   │      │    on catalog mismatch   │
    │  - runner invokes       │      │    (boot-time check)     │
    └──────────┬──────────────┘      └────────────────────────┘
               │
    ┌──────────▼──────────────────────────────┐
    │ modules/{module}/tools.ts                │
    │   ModuleTool[] — name + execute()        │
    │   registered in data/tools/init.ts       │
    └──────────────────────────────────────────┘
```

The runner flow: `Runner → policy resolver → executor → ModuleTool.execute() → Dexie`. On `propose`, the executor skips `execute()` and creates a Proposal row instead — the user approves it from the Proposal Inbox, which then calls `execute()` under the AI actor.

## Policy: `auto` vs. `propose`

Pick `defaultPolicy` carefully — it's user-facing behaviour.

| Policy        | When to use                                                                   | Examples                                                         |
| ------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **`auto`**    | Read-only, append-only, or rate-limited. Runs silently in the reasoning loop. | `list_notes`, `get_task_stats`, `log_drink`, `get_todays_events` |
| **`propose`** | Mutations the user should review. Creates a Proposal card.                    | `create_task`, `delete_note`, `update_note`, `create_event`      |

Rule of thumb: if undoing the action is a hassle → `propose`. If it's a lookup or a tiny append (logging a glass of water) → `auto`. The per-agent `policy` field can still override either direction at runtime.

## Step 1 — Catalog entry

File: `packages/shared-ai/src/tools/schemas.ts`

Append to `AI_TOOL_CATALOG`. Group entries by module, separated with a `// ── ModuleName ──` header comment.

```typescript
// ── Quiz ──────────────────────────────────────────────────
{
    name: 'create_quiz',
    module: 'quiz',
    description: 'Erstellt ein neues Quiz mit Titel und optionaler Kategorie',
    defaultPolicy: 'propose',
    parameters: [
        { name: 'title', type: 'string', description: 'Titel', required: true },
        { name: 'category', type: 'string', description: 'Kategorie', required: false },
    ],
},
{
    name: 'list_quizzes',
    module: 'quiz',
    description: 'Listet alle Quizze',
    defaultPolicy: 'auto',
    parameters: [
        { name: 'limit', type: 'number', description: 'Max Anzahl', required: false },
    ],
},
```

**Writing style:**

- `name` — snake_case verb + noun (`create_quiz`, `add_question`, not `quiz_create`). Globally unique across all modules.
- `description` — one German sentence in planner-voice. No period. No emoji. The planner reads this verbatim.
- `parameters[].description` — one clause. Include format hints (`'ISO 8601'`, `'YYYY-MM-DD'`) when non-obvious.
- `parameters[].type` — `'string' | 'number' | 'boolean'` only. Lists/objects are passed as JSON strings — decode in the executor.
- `enum` — for constrained choice sets (`priority: ['low','medium','high']`). Prefer enum over free-form strings whenever the set is bounded.

## Step 2 — Module executor

File: `apps/mana/apps/web/src/lib/modules/{module}/tools.ts` (new if the module has none)

```typescript
import type { ModuleTool } from '$lib/data/tools/types';
import { quizzesStore } from './stores/quizzes.svelte';
import { useAllQuizzes } from './queries';

export const quizTools: ModuleTool[] = [
	{
		name: 'create_quiz',
		module: 'quiz',
		description: 'Erstellt ein neues Quiz mit Titel und optionaler Kategorie',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel', required: true },
			{ name: 'category', type: 'string', description: 'Kategorie', required: false },
		],
		async execute(params) {
			const quiz = await quizzesStore.createQuiz({
				title: params.title as string,
				category: (params.category as string) ?? null,
			});
			return {
				success: true,
				data: quiz,
				message: `Quiz „${quiz.title}" erstellt`,
			};
		},
	},
];
```

**Contract:**

- `execute(params)` → `Promise<ToolResult>` where `ToolResult = { success: boolean; data?: unknown; message: string }`.
- **Params are pre-validated** by the executor against the catalog schema — don't re-check `required`/`type`, but DO cast (`as string`) since TS sees `unknown`.
- **Never throw** — convert errors to `{ success: false, message: '…' }`. The runner interprets success: false as a failed step and surfaces it in the iteration debug log.
- **`message`** is human-readable German — ends up in the Workbench timeline. Include the created/updated entity's display name so the user can scan quickly.
- **Use stores, not Dexie directly** — stores handle encryption, Dexie hooks, and actor stamping. Going around the store skips encryption.

### Keeping catalog and executor in sync

The `parameters` arrays must match between catalog and executor — there is currently no type-level enforcement, but duplication is fine because the catalog stays short and reviewable. If you deviate, the executor's runtime validation against the catalog will reject calls at step 1.

The `name`, `module`, `description`, and `parameters` fields are duplicated intentionally (ergonomics: the executor file is self-contained enough to read without cross-referencing).

## Step 3 — Register the array

File: `apps/mana/apps/web/src/lib/data/tools/init.ts`

```typescript
import { quizTools } from '$lib/modules/quiz/tools';
// …
export function initTools(): void {
	// …
	registerTools(quizTools);
}
```

That's it. `initTools()` runs once at app boot — no other wiring needed.

## Drift guard

When `mana-ai` starts, `services/mana-ai/src/planner/tools.ts` compares `AI_TOOL_CATALOG` (with `defaultPolicy: 'propose'`) against `AI_PROPOSABLE_TOOL_SET` and **throws** if they diverge. This catches forgotten catalog edits in CI and on deploy — if the service won't boot, check the error message for the drifted tool names.

The auto-tool list (`AI_AUTO_TOOL_NAMES`) in `apps/mana/apps/web/src/lib/data/ai/policy.ts` is similarly derived; no manual sync needed.

## Testing

Integration tests live in `apps/mana/apps/web/src/lib/data/tools/executor.test.ts` and cover the executor path (schema validation, policy resolution, Proposal creation). Module-specific tool tests are **optional but recommended** for non-trivial execute bodies — colocate as `{module}/tools.test.ts` and use `fake-indexeddb` with the module's store.

A minimal module-level test:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { quizTools } from './tools';

describe('quiz tools', () => {
	const createQuiz = quizTools.find((t) => t.name === 'create_quiz')!;

	it('creates a quiz with title', async () => {
		const result = await createQuiz.execute({ title: 'Test Quiz' });
		expect(result.success).toBe(true);
		expect((result.data as { title: string }).title).toBe('Test Quiz');
	});
});
```

## Checklist

When adding tools to a new module, verify:

- [ ] Catalog entries added to `AI_TOOL_CATALOG`, grouped under a `// ── ModuleName ──` comment
- [ ] `defaultPolicy` chosen per the auto/propose matrix above
- [ ] `modules/{module}/tools.ts` exists and exports `{module}Tools: ModuleTool[]`
- [ ] Each `execute()` uses the module's store (not Dexie direct) and returns `{ success, message, data? }`
- [ ] `initTools()` in `data/tools/init.ts` registers the new array
- [ ] `pnpm check` passes (catches missing imports / wrong types)
- [ ] Module coverage row added to the table in `apps/mana/CLAUDE.md` → §AI Workbench → Tool Coverage
- [ ] (Optional) Module tool test with a happy-path + one failure-path assertion

## Related

- `docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md` §20 — Runner + Policy architecture (why tools exist)
- `apps/mana/CLAUDE.md` §AI Workbench — current tool coverage across modules
- `packages/shared-ai/src/tools/schemas.ts` — catalog (read the top-of-file comment first)
- `apps/mana/apps/web/src/lib/data/tools/executor.ts` — runtime validation + policy resolution
- `services/mana-ai/src/planner/tools.ts` — server-side drift guard
