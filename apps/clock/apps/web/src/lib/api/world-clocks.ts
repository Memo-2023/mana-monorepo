/**
 * World Clocks API client
 */

import { api } from './client';
import type { WorldClock, CreateWorldClockInput } from '@clock/shared';

export const worldClocksApi = {
	/**
	 * Get all world clocks for the current user
	 */
	getAll: () => api.get<WorldClock[]>('/world-clocks'),

	/**
	 * Create a new world clock entry
	 */
	create: (data: CreateWorldClockInput) => api.post<WorldClock>('/world-clocks', data),

	/**
	 * Delete a world clock entry
	 */
	delete: (id: string) => api.delete<void>(`/world-clocks/${id}`),

	/**
	 * Reorder world clocks
	 */
	reorder: (ids: string[]) => api.put<WorldClock[]>('/world-clocks/reorder', { ids }),

	/**
	 * Search for timezones
	 */
	searchTimezones: (query: string) =>
		api.get<{ timezone: string; city: string }[]>(
			`/timezones/search?q=${encodeURIComponent(query)}`
		),
};
