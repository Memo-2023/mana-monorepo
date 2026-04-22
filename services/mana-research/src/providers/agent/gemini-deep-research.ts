/**
 * Gemini Deep Research / Deep Research Max — async via the Interactions API
 * (Gemini 3.1 Pro, public preview 04-2026).
 *
 * Docs: https://ai.google.dev/gemini-api/docs/deep-research
 *
 * Two-phase flow identical in shape to openai-deep-research:
 *   submit() — POST /v1beta/interactions with background=true → { id, status }
 *   poll(id) — GET  /v1beta/interactions/{id} → eventual { status: 'completed', output: [...] }
 *
 * One provider, two tiers: the `standard` tier (~minutes, $1–3/task) uses
 * deep-research-preview-04-2026; `max` (~20min typical, up to 60min,
 * $3–7/task) uses deep-research-max-preview-04-2026. Price/rate-limit
 * tradeoffs live in the caller — this module is tier-agnostic beyond the
 * model-id mapping.
 *
 * NOTE: model-ids end in `-preview-04-2026`; Google will publish GA model
 * names in a follow-up release. Bump the constants below when that lands.
 */

import type { AgentAnswer, Citation } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

export type GeminiDeepTier = 'standard' | 'max';

const MODEL_IDS: Record<GeminiDeepTier, string> = {
	standard: 'deep-research-preview-04-2026',
	max: 'deep-research-max-preview-04-2026',
};

const PROVIDER_IDS: Record<GeminiDeepTier, 'gemini-deep-research' | 'gemini-deep-research-max'> = {
	standard: 'gemini-deep-research',
	max: 'gemini-deep-research-max',
};

export interface GeminiDeepSubmitResult {
	externalId: string;
	status: 'queued' | 'running';
}

export interface GeminiDeepPollResult {
	status: 'queued' | 'running' | 'completed' | 'failed';
	answer?: AgentAnswer;
	error?: string;
}

interface GeminiInteractionSubmitResponse {
	id?: string;
	name?: string;
	status?: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'incomplete';
	error?: { message?: string };
}

/**
 * Items in the `outputs` array of a completed Gemini interaction.
 * Observed shapes (2026-04-22 preview):
 *   - { type: 'thought', signature, summary: [{ type: 'text', text }, ...] }
 *   - { type: 'text', text, annotations?: [{ type: 'url_citation', url, start_index, end_index }, ...] }
 *   - { type: 'image', mime_type: 'image/png', data: <base64> }
 *   - { }  (occasional empty items — we ignore them)
 */
interface GeminiOutputItem {
	type?: 'thought' | 'text' | 'image' | string;
	text?: string;
	annotations?: Array<{
		type?: string;
		url?: string;
		start_index?: number;
		end_index?: number;
	}>;
	mime_type?: string;
	data?: string;
}

interface GeminiInteractionPollResponse extends GeminiInteractionSubmitResponse {
	outputs?: GeminiOutputItem[];
	usage?: {
		total_tokens?: number;
		total_input_tokens?: number;
		total_output_tokens?: number;
		total_cached_tokens?: number;
		total_tool_use_tokens?: number;
		total_thought_tokens?: number;
	};
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function authHeaders(apiKey: string): Record<string, string> {
	// Gemini accepts either `?key=...` or `x-goog-api-key`. Header is cleaner
	// for logging and avoids url-encoding.
	return {
		'Content-Type': 'application/json',
		'x-goog-api-key': apiKey,
	};
}

export async function submitGeminiDeepResearch(
	tier: GeminiDeepTier,
	query: string,
	options: { systemPrompt?: string; maxTokens?: number } = {},
	apiKey: string | null,
	signal?: AbortSignal
): Promise<GeminiDeepSubmitResult> {
	const providerId = PROVIDER_IDS[tier];
	if (!apiKey) throw new ProviderNotConfiguredError(providerId);

	const body: Record<string, unknown> = {
		agent: MODEL_IDS[tier],
		input: options.systemPrompt ? `${options.systemPrompt}\n\n${query}` : query,
		background: true,
		store: true,
		agent_config: {
			type: 'deep-research',
			thinking_summaries: 'auto',
			visualization: 'auto',
			collaborative_planning: false,
		},
		tools: [{ type: 'google_search' }, { type: 'url_context' }, { type: 'code_execution' }],
	};
	if (options.maxTokens) body.max_output_tokens = options.maxTokens;

	const res = await fetch(`${API_BASE}/interactions`, {
		method: 'POST',
		headers: authHeaders(apiKey),
		body: JSON.stringify(body),
		signal,
	});

	if (!res.ok) {
		const errBody = await res.text().catch(() => '');
		throw new ProviderError(providerId, `submit HTTP ${res.status} ${errBody.slice(0, 300)}`);
	}

	const data = (await res.json()) as GeminiInteractionSubmitResponse;
	const externalId = data.id ?? data.name?.replace(/^interactions\//, '');
	if (!externalId) throw new ProviderError(providerId, 'submit: missing interaction id');

	return {
		externalId,
		status: data.status === 'in_progress' ? 'running' : 'queued',
	};
}

export async function pollGeminiDeepResearch(
	tier: GeminiDeepTier,
	externalId: string,
	apiKey: string | null,
	signal?: AbortSignal
): Promise<GeminiDeepPollResult> {
	const providerId = PROVIDER_IDS[tier];
	if (!apiKey) throw new ProviderNotConfiguredError(providerId);

	const res = await fetch(`${API_BASE}/interactions/${encodeURIComponent(externalId)}`, {
		headers: authHeaders(apiKey),
		signal,
	});

	if (!res.ok) {
		const errBody = await res.text().catch(() => '');
		throw new ProviderError(providerId, `poll HTTP ${res.status} ${errBody.slice(0, 300)}`);
	}

	const data = (await res.json()) as GeminiInteractionPollResponse;

	if (data.status === 'queued') return { status: 'queued' };
	if (data.status === 'in_progress') return { status: 'running' };
	if (data.status === 'failed' || data.status === 'incomplete' || data.status === 'cancelled') {
		return { status: 'failed', error: data.error?.message ?? data.status };
	}

	// completed — walk the flat `outputs` array:
	//   - `thought` items are the live-streamed reasoning summaries, skipped
	//     because we already have the final report.
	//   - `text` items carry the report prose + url_citation annotations.
	//   - `image` items carry charts/infographics (base64 PNG); surfaced
	//     via providerRaw for now, not inlined into the answer text.
	const textParts: string[] = [];
	const citations = new Map<string, Citation>();

	for (const item of data.outputs ?? []) {
		if (item.type === 'text' && item.text) {
			textParts.push(item.text);
			for (const ann of item.annotations ?? []) {
				if (ann.type === 'url_citation' && ann.url && !citations.has(ann.url)) {
					citations.set(ann.url, {
						url: ann.url,
						title: hostnameFromUrl(ann.url) ?? ann.url,
					});
				}
			}
		}
		// `thought` and `image` handled by leaving them in providerRaw
		// where a downstream consumer (future Research Lab UI) can surface
		// them without us having to model them here.
	}

	const usage = data.usage;
	const tokenUsage = usage
		? {
				input: usage.total_input_tokens ?? 0,
				output: usage.total_output_tokens ?? 0,
			}
		: undefined;

	const answer: AgentAnswer = {
		query: '',
		answer: textParts.join('').trim(),
		citations: [...citations.values()],
		tokenUsage,
		providerRaw: data,
	};

	return { status: 'completed', answer };
}

function hostnameFromUrl(url: string): string | null {
	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
}
