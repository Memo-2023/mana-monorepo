/**
 * companionChatTask — LLM task definition for the Companion Brain chat.
 *
 * Routes through the shared LlmOrchestrator so the user's tier settings
 * and privacy rules are respected:
 *
 * - minTier: browser (needs at least local Gemma; no rules fallback)
 * - contentClass: 'personal' — user messages may reference their data
 *   but aren't the most sensitive class (which is reserved for things
 *   like Journal, Dreams, Finance). 'personal' allows mana-server or
 *   cloud if the user opted in; 'sensitive' would restrict to browser.
 * - streaming: true — the chat UI relies on per-token updates
 *
 * Individual callers can override the tier via settings.taskOverrides
 * (e.g. force cloud for Companion even if the default is browser).
 */

import type { LlmBackend, LlmTask, GenerateResult } from '@mana/shared-llm';

export interface CompanionChatInput {
	messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
	temperature?: number;
	maxTokens?: number;
	onToken?: (token: string) => void;
}

export type CompanionChatOutput = {
	content: string;
	usage?: GenerateResult['usage'];
};

export const companionChatTask: LlmTask<CompanionChatInput, CompanionChatOutput> = {
	name: 'companion.chat',
	minTier: 'browser',
	contentClass: 'personal',
	requires: { streaming: true },
	displayLabel: 'Companion Chat',

	async runLlm(input: CompanionChatInput, backend: LlmBackend): Promise<CompanionChatOutput> {
		const result = await backend.generate({
			taskName: 'companion.chat',
			contentClass: 'personal',
			messages: input.messages,
			temperature: input.temperature ?? 0.7,
			maxTokens: input.maxTokens ?? 1024,
			onToken: input.onToken,
		});
		return {
			content: result.content,
			usage: result.usage,
		};
	},
};
