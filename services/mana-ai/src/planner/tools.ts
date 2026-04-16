/**
 * Server-side tool list — derived from the AI Tool Catalog.
 *
 * The full schema definitions now live in `@mana/shared-ai/src/tools/schemas.ts`.
 * This file filters the catalog to the proposable subset (tools the server-side
 * planner may suggest) and provides the name sets used by the parser and drift guard.
 *
 * Adding a new tool: add it to `AI_TOOL_CATALOG` in `@mana/shared-ai` — this
 * file picks it up automatically.
 */

import { AI_TOOL_CATALOG, AI_PROPOSABLE_TOOL_SET, type AvailableTool } from '@mana/shared-ai';

/** Tools the server-side planner may propose (defaultPolicy === 'propose'). */
export const AI_AVAILABLE_TOOLS: readonly AvailableTool[] = AI_TOOL_CATALOG.filter(
	(t) => t.defaultPolicy === 'propose'
);

export const AI_AVAILABLE_TOOL_NAMES = new Set<string>(AI_AVAILABLE_TOOLS.map((t) => t.name));

// ── Contract check — runs on module load ───────────────────
// Both sides now derive from the same catalog, so drift is structurally
// impossible. This lightweight guard catches regressions if the derivation
// logic is ever accidentally changed.
{
	const extra = [...AI_AVAILABLE_TOOL_NAMES].filter((n) => !AI_PROPOSABLE_TOOL_SET.has(n));
	const missing = [...AI_PROPOSABLE_TOOL_SET].filter((n) => !AI_AVAILABLE_TOOL_NAMES.has(n));
	if (extra.length || missing.length) {
		throw new Error(
			`[mana-ai] AI_AVAILABLE_TOOLS drift vs AI_PROPOSABLE_TOOL_NAMES. ` +
				`extra=${JSON.stringify(extra)} missing=${JSON.stringify(missing)}`
		);
	}
}
