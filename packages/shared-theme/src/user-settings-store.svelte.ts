import type {
	UserSettingsStore,
	UserSettingsStoreConfig,
	GlobalSettings,
	AppOverride,
	NavSettings,
	ThemeSettings,
	UserSettingsResponse,
	GeneralSettings,
	DeviceAppSettings,
	DeviceInfo,
	DeviceType,
	DevicesListResponse,
} from './types';
import { DEFAULT_GLOBAL_SETTINGS, DEFAULT_GENERAL_SETTINGS } from './types';
import { isBrowser } from './utils';
import { getStartPage as getStartPageFromConfig } from './app-routes';

const STORAGE_KEY_PREFIX = 'mana-user-settings';
const DEVICE_ID_KEY = 'mana-device-id';

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
	return 'dev_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Get or create device ID from localStorage
 */
function getOrCreateDeviceId(): string {
	if (!isBrowser()) return 'server';
	try {
		let deviceId = localStorage.getItem(DEVICE_ID_KEY);
		if (!deviceId) {
			deviceId = generateDeviceId();
			localStorage.setItem(DEVICE_ID_KEY, deviceId);
		}
		return deviceId;
	} catch {
		return generateDeviceId();
	}
}

/**
 * Detect device type based on user agent and screen size
 */
function detectDeviceType(): DeviceType {
	if (!isBrowser()) return 'desktop';
	const ua = navigator.userAgent.toLowerCase();
	const isMobile = /mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua);
	const isTablet = /tablet|ipad|android(?!.*mobile)/i.test(ua);
	if (isTablet) return 'tablet';
	if (isMobile) return 'mobile';
	return 'desktop';
}

/**
 * Detect device name based on user agent
 */
function detectDeviceName(): string {
	if (!isBrowser()) return 'Server';
	const ua = navigator.userAgent;
	// Try to extract device/browser info
	if (/iPhone/.test(ua)) return 'iPhone';
	if (/iPad/.test(ua)) return 'iPad';
	if (/Android/.test(ua)) {
		const match = ua.match(/Android.*;\s*([^;)]+)/);
		if (match) return match[1].trim();
		return 'Android Gerät';
	}
	if (/Mac/.test(ua)) return 'Mac';
	if (/Windows/.test(ua)) return 'Windows PC';
	if (/Linux/.test(ua)) return 'Linux PC';
	return 'Unbekanntes Gerät';
}

/**
 * Create a User Settings store for your app
 *
 * This store syncs settings with mana-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 *
 * @example
 * ```typescript
 * import { createUserSettingsStore } from '@mana/shared-theme';
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
	const { appId, authUrl: authUrlConfig, getAccessToken, deviceName, deviceType } = config;
	const resolveAuthUrl = () =>
		typeof authUrlConfig === 'function' ? authUrlConfig() : authUrlConfig;
	const storageKey = `${STORAGE_KEY_PREFIX}-${appId}`;

	// Device info (initialized once)
	const deviceId = getOrCreateDeviceId();
	const detectedDeviceType = deviceType || detectDeviceType();
	const detectedDeviceName = deviceName || detectDeviceName();

	// State
	let globalSettings = $state<GlobalSettings>({ ...DEFAULT_GLOBAL_SETTINGS });
	let appOverrides = $state<Record<string, AppOverride>>({});
	let deviceSettings = $state<Record<string, DeviceAppSettings>>({});
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

	// Derived: resolved general settings (always from global)
	const general = $derived<GeneralSettings>({
		...DEFAULT_GENERAL_SETTINGS,
		...globalSettings.general,
	});

	// Derived: start page for current app
	const startPage = $derived(getStartPageFromConfig(appId, general.startPages));

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
					deviceSettings,
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
				if (data.deviceSettings) {
					deviceSettings = data.deviceSettings;
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
	async function apiRequest<T>(method: string, path: string, body?: object): Promise<T | null> {
		const token = await getAccessToken();
		if (!token) {
			console.warn('No access token available for settings API');
			return null;
		}

		try {
			const response = await fetch(`${resolveAuthUrl()}/api/v1/settings${path}`, {
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
				deviceSettings = data.deviceSettings || {};
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
			general: {
				...globalSettings.general,
				...settings.general,
				startPages: {
					...globalSettings.general?.startPages,
					...settings.general?.startPages,
				},
			},
			recentEmojis: settings.recentEmojis ?? globalSettings.recentEmojis,
			wallpaper: settings.wallpaper !== undefined ? settings.wallpaper : globalSettings.wallpaper,
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
				deviceSettings = data.deviceSettings || {};
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
				deviceSettings = data.deviceSettings || {};
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
	 * Update start page for a specific app
	 */
	async function setStartPage(targetAppId: string, path: string): Promise<void> {
		await updateGlobal({
			general: {
				startPages: {
					[targetAppId]: path,
				},
			},
		} as Partial<GlobalSettings>);
	}

	/**
	 * Update general settings
	 */
	async function updateGeneral(settings: Partial<GeneralSettings>): Promise<void> {
		await updateGlobal({
			general: {
				...globalSettings.general,
				...settings,
				startPages: {
					...globalSettings.general?.startPages,
					...settings.startPages,
				},
			},
		});
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
				deviceSettings = data.deviceSettings || {};
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
	 * Get hidden nav items for a specific app
	 */
	function getHiddenNavItemsForApp(targetAppId: string): string[] {
		return globalSettings.nav.hiddenNavItems?.[targetAppId] || [];
	}

	/**
	 * Toggle visibility of a navigation item for an app
	 */
	async function toggleNavItemVisibility(targetAppId: string, href: string): Promise<void> {
		const currentHidden = getHiddenNavItemsForApp(targetAppId);
		const isHidden = currentHidden.includes(href);

		const newHidden = isHidden ? currentHidden.filter((h) => h !== href) : [...currentHidden, href];

		await setHiddenNavItems(targetAppId, newHidden);
	}

	/**
	 * Set hidden nav items for an app
	 */
	async function setHiddenNavItems(targetAppId: string, hiddenHrefs: string[]): Promise<void> {
		const newHiddenNavItems = {
			...globalSettings.nav.hiddenNavItems,
			[targetAppId]: hiddenHrefs,
		};

		// Remove empty arrays
		if (hiddenHrefs.length === 0) {
			delete newHiddenNavItems[targetAppId];
		}

		await updateGlobal({
			nav: {
				hiddenNavItems: newHiddenNavItems,
			},
		} as Partial<GlobalSettings>);
	}

	// ============================================================================
	// Device Settings Functions
	// ============================================================================

	/**
	 * Update device-specific app settings for current device
	 */
	async function updateDeviceAppSettings(settings: Record<string, unknown>): Promise<void> {
		// Optimistic update
		const previousDeviceSettings = { ...deviceSettings };
		const existingDevice = deviceSettings[deviceId] || {
			deviceName: detectedDeviceName,
			deviceType: detectedDeviceType,
			lastSeen: new Date().toISOString(),
			apps: {},
		};

		deviceSettings = {
			...deviceSettings,
			[deviceId]: {
				...existingDevice,
				lastSeen: new Date().toISOString(),
				apps: {
					...existingDevice.apps,
					[appId]: {
						...(existingDevice.apps?.[appId] || {}),
						...settings,
					},
				},
			},
		};
		saveToStorage();

		syncing = true;
		try {
			const data = await apiRequest<UserSettingsResponse & { success: boolean }>(
				'PATCH',
				`/device/${deviceId}/${appId}`,
				{
					deviceName: detectedDeviceName,
					deviceType: detectedDeviceType,
					settings,
				}
			);

			if (data?.success) {
				globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...data.globalSettings };
				appOverrides = data.appOverrides || {};
				deviceSettings = data.deviceSettings || {};
				saveToStorage();
			} else {
				// Rollback on failure
				deviceSettings = previousDeviceSettings;
				saveToStorage();
			}
		} finally {
			syncing = false;
		}
	}

	/**
	 * Get device-specific app settings for current device
	 */
	function getDeviceAppSettings(): Record<string, unknown> {
		const device = deviceSettings[deviceId];
		if (!device?.apps?.[appId]) return {};
		return device.apps[appId];
	}

	/**
	 * Get list of all devices
	 */
	async function getDevices(): Promise<DeviceInfo[]> {
		const data = await apiRequest<DevicesListResponse & { success: boolean }>('GET', '/devices');
		if (data?.success) {
			return data.devices;
		}
		return [];
	}

	/**
	 * Remove a device
	 */
	async function removeDevice(targetDeviceId: string): Promise<void> {
		syncing = true;
		try {
			const data = await apiRequest<UserSettingsResponse & { success: boolean }>(
				'DELETE',
				`/device/${targetDeviceId}`
			);

			if (data?.success) {
				globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...data.globalSettings };
				appOverrides = data.appOverrides || {};
				deviceSettings = data.deviceSettings || {};
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
		get general() {
			return general;
		},
		get startPage() {
			return startPage;
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
		get deviceId() {
			return deviceId;
		},
		get deviceSettings() {
			return deviceSettings;
		},
		get currentDeviceAppSettings() {
			const device = deviceSettings[deviceId];
			if (!device?.apps?.[appId]) return {};
			return device.apps[appId];
		},

		load,
		updateGlobal,
		updateAppOverride,
		removeAppOverride,
		setStartPage,
		updateGeneral,
		getHiddenNavItemsForApp,
		toggleNavItemVisibility,
		setHiddenNavItems,
		updateDeviceAppSettings,
		getDeviceAppSettings,
		getDevices,
		removeDevice,
	};
}
