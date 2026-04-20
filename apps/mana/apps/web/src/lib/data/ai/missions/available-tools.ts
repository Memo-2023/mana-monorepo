/**
 * Build the tool list the Planner is allowed to consider.
 *
 * Only tools the policy rates `auto` or `propose` are exposed — `deny`
 * is invisible to the AI. Defence-in-depth: even if the LLM somehow
 * names a denied tool, the executor refuses at runtime.
 *
 * Returns the shared ToolSchema shape directly so the runner can pass
 * the list straight into runPlannerLoop (which calls
 * toolsToFunctionSchemas internally).
 */

import { getTools } from '../../tools/registry';
import { resolvePolicy } from '../policy';
import type { Actor } from '../../events/actor';
import type { ToolSchema } from '@mana/shared-ai';
import { AI_TOOL_CATALOG_BY_NAME } from '@mana/shared-ai';

export function getAvailableToolsForAi(aiActor: Extract<Actor, { kind: 'ai' }>): ToolSchema[] {
	return getTools()
		.filter((tool) => resolvePolicy(tool.name, aiActor) !== 'deny')
		.map((tool) => {
			// Prefer the catalog entry when available — it carries the
			// defaultPolicy we need on ToolSchema. Tools without a catalog
			// entry (playground / test-only) fall back to 'auto'.
			const catalogEntry = AI_TOOL_CATALOG_BY_NAME.get(tool.name);
			return {
				name: tool.name,
				module: tool.module,
				description: tool.description,
				defaultPolicy: catalogEntry?.defaultPolicy ?? 'auto',
				parameters: tool.parameters.map((p) => ({
					name: p.name,
					type: p.type,
					required: p.required,
					description: p.description,
					enum: p.enum,
				})),
			};
		});
}
