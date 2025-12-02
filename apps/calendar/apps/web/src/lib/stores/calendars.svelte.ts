/**
 * Calendars Store - Manages user calendars using Svelte 5 runes
 */

import type { Calendar, CreateCalendarInput, UpdateCalendarInput } from '@calendar/shared';
import * as api from '$lib/api/calendars';

// State
let calendars = $state<Calendar[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

// Derived: visible calendars
const visibleCalendars = $derived(calendars.filter((c) => c.isVisible));

// Derived: default calendar
const defaultCalendar = $derived(calendars.find((c) => c.isDefault) || calendars[0]);

export const calendarsStore = {
	// Getters
	get calendars() {
		return calendars;
	},
	get visibleCalendars() {
		return visibleCalendars;
	},
	get defaultCalendar() {
		return defaultCalendar;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all calendars
	 */
	async fetchCalendars() {
		loading = true;
		error = null;

		const result = await api.getCalendars();

		if (result.error) {
			error = result.error.message;
			calendars = [];
		} else {
			calendars = result.data || [];
		}

		loading = false;
		return result;
	},

	/**
	 * Create a new calendar
	 */
	async createCalendar(data: CreateCalendarInput) {
		const result = await api.createCalendar(data);

		if (result.data) {
			calendars = [...calendars, result.data];
		}

		return result;
	},

	/**
	 * Update a calendar
	 */
	async updateCalendar(id: string, data: UpdateCalendarInput) {
		const result = await api.updateCalendar(id, data);

		if (result.data) {
			calendars = calendars.map((c) => (c.id === id ? result.data! : c));
		}

		return result;
	},

	/**
	 * Delete a calendar
	 */
	async deleteCalendar(id: string) {
		const result = await api.deleteCalendar(id);

		if (!result.error) {
			calendars = calendars.filter((c) => c.id !== id);
		}

		return result;
	},

	/**
	 * Toggle calendar visibility
	 */
	async toggleVisibility(id: string) {
		const calendar = calendars.find((c) => c.id === id);
		if (!calendar) return;

		return this.updateCalendar(id, { isVisible: !calendar.isVisible });
	},

	/**
	 * Get calendar by ID
	 */
	getById(id: string) {
		return calendars.find((c) => c.id === id);
	},

	/**
	 * Get calendar color by ID (with fallback)
	 */
	getColor(id: string) {
		const calendar = calendars.find((c) => c.id === id);
		return calendar?.color || '#3b82f6';
	},
};
