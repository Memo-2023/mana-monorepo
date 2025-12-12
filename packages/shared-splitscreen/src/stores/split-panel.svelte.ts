/**
 * Split-Panel Store
 * Svelte 5 runes-based state management for split-screen panels.
 */

import { getContext, setContext } from 'svelte';
import type { PanelConfig, AppDefinition, StorageConfig } from '../types.js';
import { DIVIDER_CONSTRAINTS, MOBILE_BREAKPOINT } from '../types.js';
import { savePanelState, loadPanelState, createStorageConfig } from '../utils/local-storage.js';
import { updateUrlState, clearUrlState, getCurrentUrlState } from '../utils/url-state.js';

const SPLIT_PANEL_CONTEXT_KEY = Symbol('split-panel');

/**
 * Available apps that can be opened in split-screen.
 */
export const DEFAULT_APPS: AppDefinition[] = [
	{
		id: 'calendar',
		name: 'Calendar',
		baseUrl: 'http://localhost:5179',
		icon: 'calendar',
		color: '#3b82f6',
	},
	{
		id: 'todo',
		name: 'Todo',
		baseUrl: 'http://localhost:5188',
		icon: 'check-square',
		color: '#10b981',
	},
	{
		id: 'contacts',
		name: 'Contacts',
		baseUrl: 'http://localhost:5184',
		icon: 'users',
		color: '#8b5cf6',
	},
	{
		id: 'clock',
		name: 'Clock',
		baseUrl: 'http://localhost:5187',
		icon: 'clock',
		color: '#f59e0b',
	},
];

export interface SplitPanelStore {
	// State
	readonly isActive: boolean;
	readonly rightPanel: PanelConfig | null;
	readonly dividerPosition: number;
	readonly isMobile: boolean;

	// Available apps (excluding current)
	readonly availableApps: AppDefinition[];

	// Actions
	openPanel: (appId: string, path?: string) => void;
	closePanel: () => void;
	swapPanels: () => void;
	setDividerPosition: (position: number) => void;
	resetDividerPosition: () => void;
	initialize: () => void;
}

/**
 * Create a split-panel store for an app.
 */
export function createSplitPanelStore(
	currentAppId: string,
	apps: AppDefinition[] = DEFAULT_APPS
): SplitPanelStore {
	// Reactive state using Svelte 5 runes
	let isActive = $state(false);
	let rightPanel = $state<PanelConfig | null>(null);
	let dividerPosition = $state(DIVIDER_CONSTRAINTS.DEFAULT);
	let isMobile = $state(false);

	// Storage config for persistence
	const storageConfig: StorageConfig = createStorageConfig(currentAppId);

	// Filter out current app from available apps
	const availableApps = $derived(apps.filter((app) => app.id !== currentAppId));

	/**
	 * Open an app in the right panel.
	 */
	function openPanel(appId: string, path = '/'): void {
		if (isMobile) return;

		const app = apps.find((a) => a.id === appId);
		if (!app || app.id === currentAppId) return;

		const url = `${app.baseUrl}${path}`;

		rightPanel = {
			appId: app.id,
			url,
			name: app.name,
		};
		isActive = true;

		// Persist to URL and localStorage
		updateUrlState({ panel: appId, split: dividerPosition });
		savePanelState(storageConfig, { rightPanel, dividerPosition, isActive: true });
	}

	/**
	 * Close the split panel.
	 */
	function closePanel(): void {
		rightPanel = null;
		isActive = false;

		// Clear persistence
		clearUrlState();
		savePanelState(storageConfig, { rightPanel: null, dividerPosition, isActive: false });
	}

	/**
	 * Swap left and right panels (navigate to the right panel app).
	 */
	function swapPanels(): void {
		if (!rightPanel) return;

		// Navigate to the other app
		const targetUrl = rightPanel.url;
		window.location.href = targetUrl;
	}

	/**
	 * Set the divider position.
	 */
	function setDividerPosition(position: number): void {
		const clamped = Math.max(DIVIDER_CONSTRAINTS.MIN, Math.min(DIVIDER_CONSTRAINTS.MAX, position));
		dividerPosition = clamped;

		// Persist
		if (isActive) {
			updateUrlState({ panel: rightPanel?.appId, split: clamped });
			savePanelState(storageConfig, { rightPanel, dividerPosition: clamped, isActive });
		}
	}

	/**
	 * Reset divider to default position.
	 */
	function resetDividerPosition(): void {
		setDividerPosition(DIVIDER_CONSTRAINTS.DEFAULT);
	}

	/**
	 * Initialize from URL and localStorage.
	 */
	function initialize(): void {
		if (typeof window === 'undefined') return;

		// Check mobile
		const checkMobile = () => {
			isMobile = window.innerWidth < MOBILE_BREAKPOINT;
			if (isMobile && isActive) {
				closePanel();
			}
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Load from URL first, then localStorage
		const urlState = getCurrentUrlState();
		const storedState = loadPanelState(storageConfig);

		const panelAppId = urlState.panel || storedState?.rightPanel?.appId;
		const savedPosition = urlState.split || storedState?.dividerPosition;

		if (panelAppId && !isMobile) {
			const app = apps.find((a) => a.id === panelAppId);
			if (app && app.id !== currentAppId) {
				openPanel(panelAppId);
				if (savedPosition) {
					setDividerPosition(savedPosition);
				}
			}
		}
	}

	// Return the store interface with getters for reactive access
	return {
		get isActive() {
			return isActive;
		},
		get rightPanel() {
			return rightPanel;
		},
		get dividerPosition() {
			return dividerPosition;
		},
		get isMobile() {
			return isMobile;
		},
		get availableApps() {
			return availableApps;
		},
		openPanel,
		closePanel,
		swapPanels,
		setDividerPosition,
		resetDividerPosition,
		initialize,
	};
}

/**
 * Set the split-panel store in Svelte context.
 * Call this in your layout component.
 */
export function setSplitPanelContext(
	currentAppId: string,
	apps: AppDefinition[] = DEFAULT_APPS
): SplitPanelStore {
	const store = createSplitPanelStore(currentAppId, apps);
	setContext(SPLIT_PANEL_CONTEXT_KEY, store);
	return store;
}

/**
 * Get the split-panel store from Svelte context.
 * Call this in child components.
 */
export function getSplitPanelContext(): SplitPanelStore {
	const store = getContext<SplitPanelStore>(SPLIT_PANEL_CONTEXT_KEY);
	if (!store) {
		throw new Error(
			'[SplitScreen] No split-panel context found. Did you call setSplitPanelContext in a parent component?'
		);
	}
	return store;
}

/**
 * Check if split-panel context exists.
 */
export function hasSplitPanelContext(): boolean {
	try {
		getContext(SPLIT_PANEL_CONTEXT_KEY);
		return true;
	} catch {
		return false;
	}
}
