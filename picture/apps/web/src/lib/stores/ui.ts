import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const UI_VISIBLE_KEY = 'picture_ui_visible';

function loadInitialState(): boolean {
	if (!browser) return true;
	const saved = localStorage.getItem(UI_VISIBLE_KEY);
	return saved !== 'false'; // Default to true
}

export const isUIVisible = writable<boolean>(loadInitialState());

export function toggleUI() {
	isUIVisible.update((visible) => {
		const newState = !visible;
		if (browser) {
			localStorage.setItem(UI_VISIBLE_KEY, String(newState));
		}
		return newState;
	});
}

export const showKeyboardShortcuts = writable<boolean>(false);
