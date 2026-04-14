/**
 * aiPlanTask — LLM task for the Mission Planner.
 *
 * Takes a Mission plus pre-resolved inputs + available tools, asks the
 * configured LLM backend for a structured plan, parses it, and returns
 * typed steps the Runner turns into Proposals.
 *
 * Routing:
 * - `minTier: 'browser'` — the Planner runs entirely on the device by
 *   default. Users can override to mana-server / cloud in settings for
 *   more capable reasoning on long missions.
 * - `contentClass: 'personal'` — the prompt contains the user's notes and
 *   goals. If any linked input is from a strictly-sensitive module
 *   (journal, dreams, finance), the Runner is responsible for narrowing
 *   to `'sensitive'` on the request so cloud is refused.
 *
 * Error path: the parser returns a structured `ParseResult`. If parsing
 * fails, the task still returns — with `steps: []` and a summary
 * explaining why — so the Runner can record a failed iteration without
 * throwing through the whole mission queue.
 */

import type { LlmBackend, LlmTask } from '@mana/shared-llm';
import { buildPlannerPrompt } from '$lib/data/ai/missions/planner/prompt';
import { parsePlannerResponse } from '$lib/data/ai/missions/planner/parser';
import type { AiPlanInput, AiPlanOutput } from '$lib/data/ai/missions/planner/types';

export type { AiPlanInput, AiPlanOutput } from '$lib/data/ai/missions/planner/types';

export const aiPlanTask: LlmTask<AiPlanInput, AiPlanOutput> = {
	name: 'ai.plan',
	minTier: 'browser',
	contentClass: 'personal',
	requires: { streaming: false },
	displayLabel: 'AI Mission Planner',

	async runLlm(input: AiPlanInput, backend: LlmBackend): Promise<AiPlanOutput> {
		const { system, user } = buildPlannerPrompt(input);

		const result = await backend.generate({
			taskName: 'ai.plan',
			contentClass: 'personal',
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user },
			],
			temperature: 0.3,
			maxTokens: 1024,
		});

		const knownToolNames = new Set(input.availableTools.map((t) => t.name));
		const parsed = parsePlannerResponse(result.content, knownToolNames);

		if (!parsed.ok) {
			return {
				steps: [],
				summary: `Plan konnte nicht erzeugt werden: ${parsed.reason}`,
			};
		}
		return parsed.value;
	},
};
