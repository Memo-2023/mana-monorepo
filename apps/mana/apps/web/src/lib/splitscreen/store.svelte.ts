/**
 * Split-Screen Store — Svelte 5 runes store
 *
 * Manages split-screen panel state: which app is shown, divider position,
 * component loading, and localStorage persistence.
 */

import type { Component } from 'svelte';
import { loadAppComponent, type SplitAppId } from './registry';

const STORAGE_KEY = 'mana:split-screen';
const MIN_POSITION = 20;
const MAX_POSITION = 80;
const DEFAULT_POSITION = 50;
const MIN_SCREEN_WIDTH = 1024;

interface PersistedState {
	splitApp: SplitAppId | null;
	dividerPosition: number;
}

function loadPersisted(): PersistedState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { splitApp: null, dividerPosition: DEFAULT_POSITION };
		const parsed = JSON.parse(raw) as PersistedState;
		return {
			splitApp: parsed.splitApp ?? null,
			dividerPosition: clamp(parsed.dividerPosition ?? DEFAULT_POSITION),
		};
	} catch {
		return { splitApp: null, dividerPosition: DEFAULT_POSITION };
	}
}

function savePersisted(state: PersistedState) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Storage full or unavailable — ignore
	}
}

function clamp(pos: number): number {
	return Math.min(MAX_POSITION, Math.max(MIN_POSITION, pos));
}

function createSplitStore() {
	const persisted =
		typeof window !== 'undefined'
			? loadPersisted()
			: { splitApp: null, dividerPosition: DEFAULT_POSITION };

	let splitApp = $state<SplitAppId | null>(null);
	let SplitComponent = $state<Component | null>(null);
	let dividerPosition = $state(persisted.dividerPosition);
	let isLoading = $state(false);
	let isMobile = $state(
		typeof window !== 'undefined' ? window.innerWidth < MIN_SCREEN_WIDTH : false
	);

	const isActive = $derived(!isMobile && splitApp !== null && SplitComponent !== null);

	// Listen for resize
	if (typeof window !== 'undefined') {
		window.addEventListener('resize', () => {
			isMobile = window.innerWidth < MIN_SCREEN_WIDTH;
		});

		// Restore persisted app on load
		if (persisted.splitApp && !isMobile) {
			isLoading = true;
			loadAppComponent(persisted.splitApp).then((component) => {
				if (component) {
					SplitComponent = component;
					splitApp = persisted.splitApp;
				}
				isLoading = false;
			});
		}
	}

	return {
		get splitApp() {
			return splitApp;
		},
		get SplitComponent() {
			return SplitComponent;
		},
		get dividerPosition() {
			return dividerPosition;
		},
		get isLoading() {
			return isLoading;
		},
		get isActive() {
			return isActive;
		},
		get isMobile() {
			return isMobile;
		},

		async openSplit(appId: SplitAppId) {
			if (isMobile) return;
			if (splitApp === appId) return;

			isLoading = true;
			const component = await loadAppComponent(appId);
			if (component) {
				SplitComponent = component;
				splitApp = appId;
				savePersisted({ splitApp: appId, dividerPosition });
			}
			isLoading = false;
		},

		closeSplit() {
			splitApp = null;
			SplitComponent = null;
			isLoading = false;
			savePersisted({ splitApp: null, dividerPosition });
		},

		setDividerPosition(pos: number) {
			dividerPosition = clamp(pos);
			if (splitApp) {
				savePersisted({ splitApp, dividerPosition });
			}
		},
	};
}

export const splitStore = createSplitStore();
