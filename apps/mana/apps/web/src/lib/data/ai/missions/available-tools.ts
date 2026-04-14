/**
 * Build the tool list the Planner is allowed to consider.
 *
 * Only tools the policy rates `auto` or `propose` are exposed — `deny` is
 * invisible to the AI. This is defence-in-depth: even if the Planner
 * hallucinates a denied tool name, the parser rejects it because the name
 * isn't in the allow-set, AND the executor would refuse at runtime.
 */

import { getTools } from '../../tools/registry';
import { resolvePolicy } from '../policy';
import type { Actor } from '../../events/actor';
import type { AvailableTool } from './planner/types';

export function getAvailableToolsForAi(aiActor: Extract<Actor, { kind: 'ai' }>): AvailableTool[] {
	return getTools()
		.filter((tool) => resolvePolicy(tool.name, aiActor) !== 'deny')
		.map((tool) => ({
			name: tool.name,
			module: tool.module,
			description: tool.description,
			parameters: tool.parameters.map((p) => ({
				name: p.name,
				type: p.type,
				required: p.required,
				description: p.description,
				enum: p.enum,
			})),
		}));
}
