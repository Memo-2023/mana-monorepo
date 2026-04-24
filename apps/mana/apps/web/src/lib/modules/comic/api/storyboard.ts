/**
 * Storyboard client. Calls `/api/v1/comic/storyboard` with the
 * decrypted source text (journal entry, note, library review,
 * writing draft, calendar event description) and the chosen style,
 * receives an ordered `Panel[]` suggestion that the user reviews +
 * edits before firing the batch-gen flow (M3).
 *
 * Cross-module decrypt stays client-side — the browser loads the
 * source module's row, passes it through its own decryptor, and
 * hands us plaintext. No Key-Grants / server-side decrypts involved
 * (matches the plan §6 decision: M4 is interactive client-side).
 *
 * Plan: docs/plans/comic-module.md M4.
 */

import { getManaApiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';
import type { ComicStyle } from '../types';

export type StoryboardSourceModule = 'journal' | 'notes' | 'library' | 'writing' | 'calendar';

export interface StoryboardPanel {
	prompt: string;
	caption?: string;
	dialogue?: string;
}

export interface SuggestPanelsParams {
	style: ComicStyle;
	sourceText: string;
	panelCount: number;
	/** Story-level briefing the author typed when creating the story.
	 *  Gets prepended server-side so Claude knows the tonal register. */
	storyContext?: string | null;
	/** Logged for observability only — not sent to the LLM. */
	sourceModule?: StoryboardSourceModule;
}

export interface SuggestPanelsResult {
	panels: StoryboardPanel[];
	model: string;
	durationMs: number;
}

export async function suggestPanels(params: SuggestPanelsParams): Promise<SuggestPanelsResult> {
	const token = await authStore.getValidToken();
	const res = await fetch(`${getManaApiUrl()}/api/v1/comic/storyboard`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			style: params.style,
			sourceText: params.sourceText,
			panelCount: params.panelCount,
			storyContext: params.storyContext,
			sourceModule: params.sourceModule,
		}),
	});

	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
		const label = body.error ?? `Storyboard fehlgeschlagen (${res.status})`;
		throw new Error(body.detail ? `${label}: ${body.detail}` : label);
	}

	const data = (await res.json()) as SuggestPanelsResult;
	if (!Array.isArray(data.panels) || data.panels.length === 0) {
		throw new Error('Keine Panels vom Modell zurück — versuche es mit anderem Text oder Stil.');
	}
	return data;
}
