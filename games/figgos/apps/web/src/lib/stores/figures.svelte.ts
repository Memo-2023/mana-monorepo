import { browser } from '$app/environment';
import type { Figure, PublicFigure, UserFigure, CreateFigureInput } from '@figgos/shared';
import { authStore } from './auth.svelte';

const API_URL = 'http://localhost:3012';

async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
	try {
		const token = await authStore.getAccessToken();
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...options.headers,
		};

		if (token) {
			(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
		}

		const response = await fetch(`${API_URL}/api${endpoint}`, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return { error: errorData.message || `Request failed: ${response.status}` };
		}

		const data = await response.json();
		return { data };
	} catch (error) {
		console.error('API request error:', error);
		return { error: 'Network error' };
	}
}

// Public figures state
let publicFigures = $state<PublicFigure[]>([]);
let publicLoading = $state(false);
let publicError = $state<string | null>(null);

// User figures state
let userFigures = $state<UserFigure[]>([]);
let userLoading = $state(false);
let userError = $state<string | null>(null);

// Generation state
let generating = $state(false);
let generationError = $state<string | null>(null);

export const figureStore = {
	// Public figures
	get publicFigures() {
		return publicFigures;
	},
	get publicLoading() {
		return publicLoading;
	},
	get publicError() {
		return publicError;
	},

	// User figures
	get userFigures() {
		return userFigures;
	},
	get userLoading() {
		return userLoading;
	},
	get userError() {
		return userError;
	},

	// Generation
	get generating() {
		return generating;
	},
	get generationError() {
		return generationError;
	},

	async loadPublicFigures(page = 1, limit = 20) {
		if (!browser) return;

		publicLoading = true;
		publicError = null;

		const { data, error } = await apiRequest<PublicFigure[]>(
			`/figures/public?page=${page}&limit=${limit}`
		);

		if (error) {
			publicError = error;
		} else if (data) {
			publicFigures = data;
		}

		publicLoading = false;
	},

	async loadUserFigures(includeArchived = false) {
		if (!browser) return;
		if (!authStore.isAuthenticated) {
			userError = 'Not authenticated';
			return;
		}

		userLoading = true;
		userError = null;

		const { data, error } = await apiRequest<UserFigure[]>(
			`/figures?includeArchived=${includeArchived}`
		);

		if (error) {
			userError = error;
		} else if (data) {
			userFigures = data;
		}

		userLoading = false;
	},

	async generateFigure(input: CreateFigureInput) {
		if (!browser) return null;
		if (!authStore.isAuthenticated) {
			generationError = 'Not authenticated';
			return null;
		}

		generating = true;
		generationError = null;

		const { data, error } = await apiRequest<Figure>('/generate/figure', {
			method: 'POST',
			body: JSON.stringify(input),
		});

		if (error) {
			generationError = error;
			generating = false;
			return null;
		}

		// Add to user figures
		if (data) {
			userFigures = [data as unknown as UserFigure, ...userFigures];
			// Also add to public if public
			if (data.isPublic) {
				publicFigures = [data as unknown as PublicFigure, ...publicFigures];
			}
		}

		generating = false;
		return data;
	},

	async toggleLike(figureId: string) {
		if (!browser) return null;
		if (!authStore.isAuthenticated) return null;

		const { data, error } = await apiRequest<{ liked: boolean; likes: number }>(
			`/figures/${figureId}/like`,
			{ method: 'POST' }
		);

		if (error) {
			console.error('Toggle like error:', error);
			return null;
		}

		// Update in public figures
		if (data) {
			publicFigures = publicFigures.map((f) =>
				f.id === figureId ? { ...f, likes: data.likes, hasLiked: data.liked } : f
			);
		}

		return data;
	},

	async updateFigure(figureId: string, updates: Partial<Figure>) {
		if (!browser) return null;
		if (!authStore.isAuthenticated) return null;

		const { data, error } = await apiRequest<Figure>(`/figures/${figureId}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});

		if (error) {
			console.error('Update figure error:', error);
			return null;
		}

		// Update in user figures
		if (data) {
			userFigures = userFigures.map((f) => (f.id === figureId ? { ...f, ...data } : f));
		}

		return data;
	},

	async deleteFigure(figureId: string) {
		if (!browser) return false;
		if (!authStore.isAuthenticated) return false;

		const { error } = await apiRequest(`/figures/${figureId}`, { method: 'DELETE' });

		if (error) {
			console.error('Delete figure error:', error);
			return false;
		}

		// Remove from lists
		userFigures = userFigures.filter((f) => f.id !== figureId);
		publicFigures = publicFigures.filter((f) => f.id !== figureId);

		return true;
	},

	async archiveFigure(figureId: string) {
		return this.updateFigure(figureId, { isArchived: true });
	},

	clearErrors() {
		publicError = null;
		userError = null;
		generationError = null;
	},
};
