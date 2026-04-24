/**
 * Writing — server-only API client. Browser → mana-api → mana-llm.
 *
 * CRUD of drafts/versions/generations stays local-first (IndexedDB
 * + sync). This module talks to mana-api for the one operation that
 * needs a server-side LLM round-trip: generating the prose itself.
 * Everything before and after the fetch — briefing storage, prompt
 * composition, version bookkeeping — lives on the client.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';

export interface GenerateDraftRequest {
	systemPrompt?: string;
	userPrompt: string;
	/** Plaintext kind discriminator forwarded for server-side logging. */
	kind?: string;
	temperature?: number;
	maxTokens?: number;
	model?: string;
}

export interface GenerateDraftResponse {
	output: string;
	model: string;
	tokenUsage?: { input: number; output: number };
	durationMs: number;
}

async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getValidToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function callWritingGeneration(
	req: GenerateDraftRequest,
	signal?: AbortSignal
): Promise<GenerateDraftResponse> {
	const res = await fetch(`${getManaApiUrl()}/api/v1/writing/generations`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(await authHeader()),
		},
		body: JSON.stringify(req),
		signal,
	});
	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Generation failed (${res.status}): ${body || res.statusText}`);
	}
	return res.json() as Promise<GenerateDraftResponse>;
}
