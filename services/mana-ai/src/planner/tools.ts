/**
 * Server-side tool surface — derived from the shared AI_TOOL_CATALOG.
 *
 * The server offers only `propose`-default (write) tools to the planner.
 * Read-only tools (`list_*`, `get_*`) are intentionally hidden because
 * the server cannot execute them — it has no Dexie access, and stubbing
 * a "recorded" response back would let the LLM hallucinate that it saw
 * real data and plan against it. The foreground runner, which DOES
 * execute reads, handles read-then-act chains.
 *
 * Each server-produced iteration captures the LLM's planned write-tool
 * calls as PlanStep entries. The user's client applies them on sync.
 */

import { AI_TOOL_CATALOG } from '@mana/shared-ai';
import type { ToolSchema } from '@mana/shared-ai';

/** Write-tools the server planner may reference. */
export const SERVER_TOOLS: readonly ToolSchema[] = AI_TOOL_CATALOG.filter(
	(t) => t.defaultPolicy === 'propose'
);

export const SERVER_TOOL_NAMES = new Set<string>(SERVER_TOOLS.map((t) => t.name));
