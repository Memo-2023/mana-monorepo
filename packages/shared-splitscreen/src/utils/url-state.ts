/**
 * URL State Utilities
 * Handle URL-based state persistence for split-screen.
 */

import type { UrlState } from '../types.js';

/**
 * Parse split-screen state from URL search params.
 * Reads `?panel=todo&split=60` format.
 */
export function parseUrlState(searchParams: URLSearchParams): UrlState {
	const panel = searchParams.get('panel') || undefined;
	const splitStr = searchParams.get('split');
	const split = splitStr ? parseInt(splitStr, 10) : undefined;

	return {
		panel,
		split: split && !isNaN(split) ? split : undefined,
	};
}

/**
 * Update URL with split-screen state without page reload.
 * Uses replaceState to avoid adding to browser history.
 */
export function updateUrlState(state: UrlState): void {
	if (typeof window === 'undefined') return;

	const url = new URL(window.location.href);

	if (state.panel) {
		url.searchParams.set('panel', state.panel);
	} else {
		url.searchParams.delete('panel');
	}

	if (state.split && state.split !== 50) {
		url.searchParams.set('split', state.split.toString());
	} else {
		url.searchParams.delete('split');
	}

	window.history.replaceState({}, '', url.toString());
}

/**
 * Clear split-screen state from URL.
 */
export function clearUrlState(): void {
	if (typeof window === 'undefined') return;

	const url = new URL(window.location.href);
	url.searchParams.delete('panel');
	url.searchParams.delete('split');
	window.history.replaceState({}, '', url.toString());
}

/**
 * Get current URL state.
 */
export function getCurrentUrlState(): UrlState {
	if (typeof window === 'undefined') return {};
	return parseUrlState(new URLSearchParams(window.location.search));
}
