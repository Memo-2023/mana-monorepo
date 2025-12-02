import type {
	UserSettingsStore,
	UserSettingsStoreConfig,
	GlobalSettings,
	AppOverride,
	NavSettings,
	ThemeSettings,
	UserSettingsResponse,
} from './types';
import { DEFAULT_GLOBAL_SETTINGS } from './types';
import { isBrowser } from './utils';

const STORAGE_KEY_PREFIX = 'manacore-user-settings';

/**
 * Create a User Settings store for your app
 *
 * This store syncs settings with mana-core-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 *
 * @example
 * ```typescript
 * import { createUserSettingsStore } from '@manacore/shared-theme';
 *
 * export const userSettings = createUserSettingsStore({
 *   appId: 'calendar',
 *   authUrl: 'http://localhost:3001',
 *   getAccessToken: () => authStore.getAccessToken()
 * });
 *
 * // In +layout.svelte
 * $effect(() => {
 *   if (authStore.isAuthenticated) {
 *     userSettings.load();
 *   }
 * });
 * ```
 */
export function createUserSettingsStore(config: UserSettingsStoreConfig): UserSettingsStore {
	const { appId, authUrl, getAccessToken } = config;
	const storageKey = `${STORAGE_KEY_PREFIX}-${appId}`;

	// State
	let globalSettings = $state<GlobalSettings>({ ...DEFAULT_GLOBAL_SETTINGS });
	let appOverrides = $state<Record<string, AppOverride>>({});
	let syncing = $state(false);
	let loaded = $state(false);

	// Derived: resolved nav settings (global + app override)
	const nav = $derived<NavSettings>({
		...globalSettings.nav,
		...(appOverrides[appId]?.nav || {}),
	});

	// Derived: resolved theme settings (global + app override)
	const theme = $derived<ThemeSettings>({
		...globalSettings.theme,
		...(appOverrides[appId]?.theme || {}),
	});

	// Derived: current locale
	const locale = $derived(globalSettings.locale);

	// Derived: whether this app has an override
	const hasAppOverride = $derived(!!appOverrides[appId]);

	/**
	 * Save current settings to localStorage (for offline fallback)
	 */
	function saveToStorage(): void {
		if (!isBrowser()) return;
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					globalSettings,
					appOverrides,
					timestamp: Date.now(),
				})
			);
		} catch (e) {
			console.error('Failed to save user settings to storage:', e);
		}
	}

	/**
	 * Load settings from localStorage (fallback)
	 */
	function loadFromStorage(): boolean {
		if (!isBrowser()) return false;
		try {
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				const data = JSON.parse(stored);
				if (data.globalSettings) {
					globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...data.globalSettings };
				}
				if (data.appOverrides) {
					appOverrides = data.appOverrides;
				}
				return true;
			}
		} catch (e) {
			console.error('Failed to load user settings from storage:', e);
		}
		return false;
	}

	/**
	 * Make an API request to the settings endpoint
	 */
	async function apiRequest<T>(
		method: string,
		path: string,
		body?: object
	): Promise<T | null> {
		const token = await getAccessToken();
		if (!token) {
			console.warn('No access token available for settings API');
			return null;
		}

		try {
			const response = await fetch(`${authUrl}/api/v1/settings${path}`, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: body ? JSON.stringify(body) : undefined,
			});

			if (!response.ok) {
				console.error(`Settings API error: ${response.status}`);
				return null;
			}

			return await response.json();
		} catch (e) {
			console.error('Settings API request failed:', e);
			return null;
		}
	}

	/**
	 * Load settings from server
	 */
	async function load(): Promise<void> {
		// Load from cache first for instant UI
		loadFromStorage();

		syncing = true;
		try {
			const data = await apiRequest<UserSettingsResponse & { success: boolean }>('GET', '');

			if (data?.success) {
				globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...data.globalSettings };
				appOverrides = data.appOverrides || {};
				saveToStorage();
				loaded = true;
			}
		} finally {
			syncing = false;
		}
	}

	/**
	 * Update global settings
	 */
	async function updateGlobal(settings: Partial<GlobalSettings>): Promise<void> {
		// Optimistic update
		const previousGlobal = { ...globalSettings };
		globalSettings = {
			nav: { ...globalSettings.nav, ...settings.nav },
			theme: { ...globalSettings.theme, ...settings.theme },
			locale: settings.locale ?? globalSettings.locale,
		};
		saveToStorage();

		syncing = true;
		try {
			const data = await apiRequest<UserSettingsResponse & { success: boolean }>(
				'PATCH',
				'/global',
				settings
			);

			if (data?.success) {
				globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...data.globalSettings };
				appOverrides = data.appOverrides || {};
				saveToStorage();
			} else {
				// Rollback on failure
				globalSettings = previousGlobal;
				saveToStorage();
			}
		} finally {
			syncing = false;
		}
	}

	/**
	 * Update app-specific override
	 */
	async function updateAppOverride(settings: AppOverride): Promise<void> {
		// Optimistic update
		const previousOverrides = { ...appOverrides };
		appOverrides = {
			...appOverrides,
			[appId]: {
				...appOverrides[appId],
				...settings,
			},
		};
		saveToStorage();

		syncing = true;
		try {
			const data = await apiRequest<UserSettingsResponse & { success: boolean }>(
				'PATCH',
				`/app/${appId}`,
				settings
			);

			if (data?.success) {
				globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...data.globalSettings };
				appOverrides = data.appOverrides || {};
				saveToStorage();
			} else {
				// Rollback on failure
				appOverrides = previousOverrides;
				saveToStorage();
			}
		} finally {
			syncing = false;
		}
	}

	/**
	 * Remove app override (revert to global settings)
	 */
	async function removeAppOverride(): Promise<void> {
		// Optimistic update
		const previousOverrides = { ...appOverrides };
		const newOverrides = { ...appOverrides };
		delete newOverrides[appId];
		appOverrides = newOverrides;
		saveToStorage();

		syncing = true;
		try {
			const data = await apiRequest<UserSettingsResponse & { success: boolean }>(
				'DELETE',
				`/app/${appId}`
			);

			if (data?.success) {
				globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...data.globalSettings };
				appOverrides = data.appOverrides || {};
				saveToStorage();
			} else {
				// Rollback on failure
				appOverrides = previousOverrides;
				saveToStorage();
			}
		} finally {
			syncing = false;
		}
	}

	return {
		get nav() {
			return nav;
		},
		get theme() {
			return theme;
		},
		get locale() {
			return locale;
		},
		get globalSettings() {
			return globalSettings;
		},
		get hasAppOverride() {
			return hasAppOverride;
		},
		get syncing() {
			return syncing;
		},
		get loaded() {
			return loaded;
		},

		load,
		updateGlobal,
		updateAppOverride,
		removeAppOverride,
	};
}
