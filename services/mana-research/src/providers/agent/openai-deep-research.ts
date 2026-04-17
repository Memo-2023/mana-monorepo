/**
 * OpenAI Deep Research — async via the Responses API with `background: true`.
 * Docs: https://platform.openai.com/docs/guides/deep-research
 *
 * Two-phase flow:
 *   submit()  — POST /v1/responses → returns { id, status: 'queued' | 'in_progress' }
 *   poll(id)  — GET  /v1/responses/{id} → eventual { status: 'completed', output: [...] }
 *
 * Results typically arrive in 5–30 minutes. We persist the OpenAI response.id
 * in research.async_jobs and expose POST /v1/research/async + GET /:taskId.
 */

import type { AgentAnswer, Citation } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

const DEFAULT_MODEL = 'o3-deep-research';

export interface DeepResearchSubmitResult {
	externalId: string;
	status: 'queued' | 'running';
}

export interface DeepResearchPollResult {
	status: 'queued' | 'running' | 'completed' | 'failed';
	answer?: AgentAnswer;
	error?: string;
}

interface OpenAISubmitResponse {
	id: string;
	status?: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'incomplete';
	error?: { message?: string };
}

interface OpenAIPollResponse extends OpenAISubmitResponse {
	output?: Array<{
		type: string;
		role?: string;
		content?: Array<{
			type: string;
			text?: string;
			annotations?: Array<{
				type: string;
				url?: string;
				title?: string;
			}>;
		}>;
	}>;
	output_text?: string;
	usage?: {
		input_tokens?: number;
		output_tokens?: number;
	};
}

export async function submitDeepResearch(
	query: string,
	options: { model?: string; maxTokens?: number; systemPrompt?: string } = {},
	apiKey: string | null,
	signal?: AbortSignal
): Promise<DeepResearchSubmitResult> {
	if (!apiKey) throw new ProviderNotConfiguredError('openai-deep-research');

	const model = options.model ?? DEFAULT_MODEL;
	const body: Record<string, unknown> = {
		model,
		input: options.systemPrompt
			? [
					{ role: 'system', content: options.systemPrompt },
					{ role: 'user', content: query },
				]
			: query,
		tools: [{ type: 'web_search_preview' }],
		background: true,
	};
	if (options.maxTokens) body.max_output_tokens = options.maxTokens;

	const res = await fetch('https://api.openai.com/v1/responses', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		signal,
	});

	if (!res.ok) {
		const errBody = await res.text().catch(() => '');
		throw new ProviderError(
			'openai-deep-research',
			`submit HTTP ${res.status} ${errBody.slice(0, 300)}`
		);
	}

	const data = (await res.json()) as OpenAISubmitResponse;
	if (!data.id) throw new ProviderError('openai-deep-research', 'submit: missing response id');

	return {
		externalId: data.id,
		status: data.status === 'in_progress' ? 'running' : 'queued',
	};
}

export async function pollDeepResearch(
	externalId: string,
	apiKey: string | null,
	signal?: AbortSignal
): Promise<DeepResearchPollResult> {
	if (!apiKey) throw new ProviderNotConfiguredError('openai-deep-research');

	const res = await fetch(`https://api.openai.com/v1/responses/${externalId}`, {
		headers: { Authorization: `Bearer ${apiKey}` },
		signal,
	});

	if (!res.ok) {
		const errBody = await res.text().catch(() => '');
		throw new ProviderError(
			'openai-deep-research',
			`poll HTTP ${res.status} ${errBody.slice(0, 300)}`
		);
	}

	const data = (await res.json()) as OpenAIPollResponse;

	if (data.status === 'queued') return { status: 'queued' };
	if (data.status === 'in_progress') return { status: 'running' };
	if (data.status === 'failed' || data.status === 'incomplete' || data.status === 'cancelled') {
		return { status: 'failed', error: data.error?.message ?? data.status };
	}

	// completed
	const textParts: string[] = [];
	const citations = new Map<string, Citation>();

	if (data.output_text) textParts.push(data.output_text);

	for (const item of data.output ?? []) {
		if (item.type !== 'message') continue;
		for (const content of item.content ?? []) {
			if (content.type === 'output_text' && content.text) {
				if (!data.output_text) textParts.push(content.text);
				for (const ann of content.annotations ?? []) {
					if (ann.url && !citations.has(ann.url)) {
						citations.set(ann.url, { url: ann.url, title: ann.title ?? ann.url });
					}
				}
			}
		}
	}

	const tokenUsage = data.usage
		? {
				input: data.usage.input_tokens ?? 0,
				output: data.usage.output_tokens ?? 0,
			}
		: undefined;

	const answer: AgentAnswer = {
		query: '',
		answer: textParts.join('\n\n'),
		citations: [...citations.values()],
		tokenUsage,
		providerRaw: data,
	};

	return { status: 'completed', answer };
}
