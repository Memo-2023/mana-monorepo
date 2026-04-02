import { subscribe, type LlmState } from './engine.js';

/**
 * Reactive status wrapper for use in Svelte 5 components.
 * Returns an object with a `current` property that updates reactively.
 */
export function getLocalLlmStatus(): { current: LlmState } {
	let state = $state<LlmState>({ state: 'idle' });

	$effect(() => {
		const unsub = subscribe((s) => {
			state = s;
		});
		return unsub;
	});

	return {
		get current() {
			return state;
		},
	};
}
