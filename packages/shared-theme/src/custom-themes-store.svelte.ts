import type {
	CustomTheme,
	CommunityTheme,
	CreateCustomThemeInput,
	UpdateCustomThemeInput,
	PublishThemeInput,
	CommunityThemeQuery,
	PaginatedCommunityThemes,
	CustomThemesStore,
	CustomThemesStoreConfig,
	ThemeColors,
	EffectiveMode,
} from './types';
import { isBrowser } from './utils';

/**
 * Apply a custom theme's colors to the document as CSS variables
 */
function applyCustomThemeToDocument(
	colors: ThemeColors,
	effectiveMode: EffectiveMode = 'light'
): void {
	if (!isBrowser()) return;

	const root = document.documentElement;

	// Apply all color variables
	Object.entries(colors).forEach(([key, value]) => {
		// Convert camelCase to kebab-case
		const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
		root.style.setProperty(`--${cssVar}`, value);
	});

	// Set mode class
	root.classList.remove('light', 'dark');
	root.classList.add(effectiveMode);

	// Mark as custom theme
	root.setAttribute('data-custom-theme', 'true');
}

/**
 * Clear custom theme and revert to standard theme
 */
function clearCustomThemeFromDocument(): void {
	if (!isBrowser()) return;

	const root = document.documentElement;

	// Remove custom theme marker
	root.removeAttribute('data-custom-theme');

	// Clear inline styles (CSS vars will fall back to theme variant)
	root.style.cssText = '';
}

/**
 * Create a custom themes store for managing user's custom themes and community themes
 *
 * @example
 * ```typescript
 * import { createCustomThemesStore } from '@manacore/shared-theme';
 * import { authStore } from '$lib/stores/auth.svelte';
 *
 * export const customThemesStore = createCustomThemesStore({
 *   authUrl: import.meta.env.PUBLIC_AUTH_URL,
 *   getAccessToken: () => authStore.getAccessToken(),
 * });
 * ```
 */
export function createCustomThemesStore(config: CustomThemesStoreConfig): CustomThemesStore {
	const { authUrl, getAccessToken } = config;

	// State
	let customThemes = $state<CustomTheme[]>([]);
	let communityThemes = $state<CommunityTheme[]>([]);
	let favorites = $state<CommunityTheme[]>([]);
	let downloaded = $state<CommunityTheme[]>([]);
	let pagination = $state({ page: 1, totalPages: 1, total: 0 });
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Track currently applied custom theme
	let appliedThemeId = $state<string | null>(null);

	/**
	 * Make an authenticated API request
	 */
	async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const token = await getAccessToken();
		if (!token) {
			throw new Error('Not authenticated');
		}

		const url = `${authUrl}${endpoint}`;
		const response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `Request failed: ${response.status}`);
		}

		// Handle 204 No Content
		if (response.status === 204) {
			return undefined as T;
		}

		return response.json();
	}

	/**
	 * Make a public API request (no auth required)
	 */
	async function publicApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${authUrl}${endpoint}`;
		const token = await getAccessToken();

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		// Add auth if available (for user-specific data like favorites)
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const response = await fetch(url, {
			...options,
			headers: {
				...headers,
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `Request failed: ${response.status}`);
		}

		return response.json();
	}

	// ==================== Custom Theme Operations ====================

	/**
	 * Load user's custom themes
	 */
	async function loadCustomThemes(): Promise<void> {
		loading = true;
		error = null;

		try {
			customThemes = await apiRequest<CustomTheme[]>('/api/v1/themes');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load themes';
			throw err;
		} finally {
			loading = false;
		}
	}

	/**
	 * Create a new custom theme
	 */
	async function createTheme(input: CreateCustomThemeInput): Promise<CustomTheme> {
		loading = true;
		error = null;

		try {
			const theme = await apiRequest<CustomTheme>('/api/v1/themes', {
				method: 'POST',
				body: JSON.stringify(input),
			});
			customThemes = [...customThemes, theme];
			return theme;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create theme';
			throw err;
		} finally {
			loading = false;
		}
	}

	/**
	 * Update an existing custom theme
	 */
	async function updateTheme(id: string, input: UpdateCustomThemeInput): Promise<CustomTheme> {
		loading = true;
		error = null;

		try {
			const theme = await apiRequest<CustomTheme>(`/api/v1/themes/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(input),
			});
			customThemes = customThemes.map((t) => (t.id === id ? theme : t));
			return theme;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update theme';
			throw err;
		} finally {
			loading = false;
		}
	}

	/**
	 * Delete a custom theme
	 */
	async function deleteTheme(id: string): Promise<void> {
		loading = true;
		error = null;

		try {
			await apiRequest(`/api/v1/themes/${id}`, {
				method: 'DELETE',
			});
			customThemes = customThemes.filter((t) => t.id !== id);

			// Clear applied theme if it was the deleted one
			if (appliedThemeId === id) {
				clearCustomTheme();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete theme';
			throw err;
		} finally {
			loading = false;
		}
	}

	/**
	 * Publish a custom theme to the community
	 */
	async function publishTheme(id: string, input?: PublishThemeInput): Promise<CommunityTheme> {
		loading = true;
		error = null;

		try {
			const communityTheme = await apiRequest<CommunityTheme>(`/api/v1/themes/${id}/publish`, {
				method: 'POST',
				body: JSON.stringify(input || {}),
			});

			// Update the custom theme's isPublished status
			customThemes = customThemes.map((t) => (t.id === id ? { ...t, isPublished: true } : t));

			return communityTheme;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to publish theme';
			throw err;
		} finally {
			loading = false;
		}
	}

	// ==================== Community Theme Operations ====================

	/**
	 * Browse community themes with filtering/sorting
	 */
	async function browseCommunity(query?: CommunityThemeQuery): Promise<void> {
		loading = true;
		error = null;

		try {
			const params = new URLSearchParams();
			if (query?.page) params.set('page', String(query.page));
			if (query?.limit) params.set('limit', String(query.limit));
			if (query?.sort) params.set('sort', query.sort);
			if (query?.search) params.set('search', query.search);
			if (query?.authorId) params.set('authorId', query.authorId);
			if (query?.featuredOnly) params.set('featuredOnly', 'true');
			if (query?.tags?.length) {
				query.tags.forEach((tag) => params.append('tags', tag));
			}

			const queryString = params.toString();
			const endpoint = `/api/v1/community-themes${queryString ? `?${queryString}` : ''}`;

			const result = await publicApiRequest<PaginatedCommunityThemes>(endpoint);
			communityThemes = result.themes;
			pagination = {
				page: result.page,
				totalPages: result.totalPages,
				total: result.total,
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to browse community themes';
			throw err;
		} finally {
			loading = false;
		}
	}

	/**
	 * Download/install a community theme
	 */
	async function downloadTheme(id: string): Promise<CommunityTheme> {
		loading = true;
		error = null;

		try {
			const theme = await apiRequest<CommunityTheme>(`/api/v1/community-themes/${id}/download`, {
				method: 'POST',
			});

			// Update download status in community themes list
			communityThemes = communityThemes.map((t) =>
				t.id === id ? { ...t, isDownloaded: true, downloadCount: theme.downloadCount } : t
			);

			// Add to downloaded list if not already there
			if (!downloaded.some((t) => t.id === id)) {
				downloaded = [...downloaded, theme];
			}

			return theme;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to download theme';
			throw err;
		} finally {
			loading = false;
		}
	}

	/**
	 * Rate a community theme
	 */
	async function rateTheme(
		id: string,
		rating: number
	): Promise<{ averageRating: number; ratingCount: number }> {
		error = null;

		try {
			const result = await apiRequest<{ averageRating: number; ratingCount: number }>(
				`/api/v1/community-themes/${id}/rate`,
				{
					method: 'POST',
					body: JSON.stringify({ rating }),
				}
			);

			// Update rating in community themes list
			communityThemes = communityThemes.map((t) =>
				t.id === id
					? {
							...t,
							averageRating: result.averageRating,
							ratingCount: result.ratingCount,
							userRating: rating,
						}
					: t
			);

			return result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to rate theme';
			throw err;
		}
	}

	/**
	 * Toggle favorite status for a community theme
	 */
	async function toggleFavorite(id: string): Promise<{ isFavorited: boolean }> {
		error = null;

		try {
			const result = await apiRequest<{ isFavorited: boolean }>(
				`/api/v1/community-themes/${id}/favorite`,
				{ method: 'POST' }
			);

			// Update favorite status in community themes list
			communityThemes = communityThemes.map((t) =>
				t.id === id ? { ...t, isFavorited: result.isFavorited } : t
			);

			// Update favorites list
			if (result.isFavorited) {
				const theme = communityThemes.find((t) => t.id === id);
				if (theme && !favorites.some((t) => t.id === id)) {
					favorites = [...favorites, { ...theme, isFavorited: true }];
				}
			} else {
				favorites = favorites.filter((t) => t.id !== id);
			}

			return result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to toggle favorite';
			throw err;
		}
	}

	/**
	 * Load user's favorite themes
	 */
	async function loadFavorites(): Promise<void> {
		loading = true;
		error = null;

		try {
			favorites = await apiRequest<CommunityTheme[]>('/api/v1/community-themes/favorites');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load favorites';
			throw err;
		} finally {
			loading = false;
		}
	}

	/**
	 * Load user's downloaded themes
	 */
	async function loadDownloaded(): Promise<void> {
		loading = true;
		error = null;

		try {
			downloaded = await apiRequest<CommunityTheme[]>('/api/v1/community-themes/downloaded');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load downloaded themes';
			throw err;
		} finally {
			loading = false;
		}
	}

	// ==================== Apply Theme ====================

	/**
	 * Apply a custom or community theme to the document
	 */
	function applyCustomTheme(theme: CustomTheme | CommunityTheme): void {
		// Determine effective mode from system or stored preference
		const effectiveMode: EffectiveMode = isBrowser()
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: 'light';

		const colors = effectiveMode === 'dark' ? theme.darkColors : theme.lightColors;
		applyCustomThemeToDocument(colors as ThemeColors, effectiveMode);
		appliedThemeId = theme.id;
	}

	/**
	 * Clear the applied custom theme and revert to standard theme
	 */
	function clearCustomTheme(): void {
		clearCustomThemeFromDocument();
		appliedThemeId = null;
	}

	return {
		get customThemes() {
			return customThemes;
		},
		get communityThemes() {
			return communityThemes;
		},
		get favorites() {
			return favorites;
		},
		get downloaded() {
			return downloaded;
		},
		get pagination() {
			return pagination;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		// Custom theme operations
		loadCustomThemes,
		createTheme,
		updateTheme,
		deleteTheme,
		publishTheme,

		// Community theme operations
		browseCommunity,
		downloadTheme,
		rateTheme,
		toggleFavorite,
		loadFavorites,
		loadDownloaded,

		// Apply theme
		applyCustomTheme,
		clearCustomTheme,
	};
}
