/**
 * Proposable tool names — derived from the AI Tool Catalog.
 *
 * Tools with `defaultPolicy: 'propose'` in the catalog are the ones the
 * server-side planner actively proposes. This file re-exports a derived
 * array and set for backward compatibility; the source of truth is
 * `../tools/schemas.ts`.
 *
 * Adding a new proposable tool:
 *   1. Add its schema to `AI_TOOL_CATALOG` with `defaultPolicy: 'propose'`
 *   2. Add the `execute` function in the webapp module's `tools.ts`
 *   3. Done — this list updates automatically
 */

import { AI_TOOL_CATALOG } from '../tools/schemas';

export const AI_PROPOSABLE_TOOL_NAMES: readonly string[] = AI_TOOL_CATALOG.filter(
	(t) => t.defaultPolicy === 'propose'
).map((t) => t.name);

export type AiProposableToolName = string;

export const AI_PROPOSABLE_TOOL_SET: ReadonlySet<string> = new Set(AI_PROPOSABLE_TOOL_NAMES);
