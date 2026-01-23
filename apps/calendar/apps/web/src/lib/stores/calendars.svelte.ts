/**
 * Calendars Store - Manages user calendars using Svelte 5 runes
 * Supports both authenticated (cloud) and guest (session) modes
 */

import type { Calendar, CreateCalendarInput, UpdateCalendarInput } from '@calendar/shared';
import * as api from '$lib/api/calendars';
import { BIRTHDAY_CALENDAR } from '$lib/api/birthdays';
import { settingsStore } from './settings.svelte';
import { authStore } from './auth.svelte';

// Guest calendar for unauthenticated users
const GUEST_CALENDAR: Calendar = {
	id: 'session-calendar',
	userId: 'guest',
	name: 'Mein Kalender',
	color: '#3b82f6',
	isDefault: true,
	isVisible: true,
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

// State
let calendars = $state<Calendar[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

// Virtual birthday calendar (created dynamically based on settings)
const birthdayCalendar: Calendar = {
	id: BIRTHDAY_CALENDAR.id,
	userId: '',
	name: BIRTHDAY_CALENDAR.name,
	color: BIRTHDAY_CALENDAR.color,
	isDefault: false,
	isVisible: true, // Visibility controlled by settingsStore.showBirthdays
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

// Helper to safely get calendars array (Svelte 5 runes safety)
function getCalendarsArray(): Calendar[] {
	const arr = calendars ?? [];
	return Array.isArray(arr) ? arr : [];
}

// Derived: all calendars including virtual birthday calendar
const allCalendars = $derived.by(() => {
	const userCalendars = getCalendarsArray();
	// Add virtual birthday calendar if birthdays are enabled in settings
	if (settingsStore.showBirthdays) {
		return [...userCalendars, { ...birthdayCalendar, isVisible: true }];
	}
	return userCalendars;
});

// Derived: visible calendars
const visibleCalendars = $derived(getCalendarsArray().filter((c) => c.isVisible));

// Derived: default calendar
const defaultCalendar = $derived.by(() => {
	const arr = getCalendarsArray();
	return arr.find((c) => c.isDefault) || arr[0] || null;
});

export const calendarsStore = {
	// Getters
	get calendars() {
		return calendars;
	},
	get allCalendars() {
		return allCalendars;
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
	get birthdayCalendarId() {
		return BIRTHDAY_CALENDAR.id;
	},

	/**
	 * Fetch all calendars
	 * In guest mode, returns a default local calendar
	 */
	async fetchCalendars() {
		loading = true;
		error = null;

		// Guest mode: return local calendar only
		if (!authStore.isAuthenticated) {
			calendars = [GUEST_CALENDAR];
			loading = false;
			return { data: { calendars: [GUEST_CALENDAR] }, error: null };
		}

		// Authenticated: fetch from API
		const result = await api.getCalendars();

		if (result.error) {
			error = result.error.message;
			calendars = [];
		} else {
			// API returns { calendars: [...] }
			const data = result.data as { calendars: Calendar[] } | null;
			calendars = data?.calendars || [];
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
			calendars = getCalendarsArray().map((c) => (c.id === id ? result.data! : c));
		}

		return result;
	},

	/**
	 * Delete a calendar
	 */
	async deleteCalendar(id: string) {
		const result = await api.deleteCalendar(id);

		if (!result.error) {
			calendars = getCalendarsArray().filter((c) => c.id !== id);
		}

		return result;
	},

	/**
	 * Toggle calendar visibility
	 */
	async toggleVisibility(id: string) {
		const arr = getCalendarsArray();
		const calendar = arr.find((c) => c.id === id);
		if (!calendar) return;

		return this.updateCalendar(id, { isVisible: !calendar.isVisible });
	},

	/**
	 * Set a calendar as the default
	 */
	async setAsDefault(id: string) {
		const result = await api.updateCalendar(id, { isDefault: true });

		if (result.data) {
			// Update local state: set this one as default, remove default from others
			calendars = getCalendarsArray().map((c) => ({
				...c,
				isDefault: c.id === id,
			}));
		}

		return result;
	},

	/**
	 * Get calendar by ID
	 */
	getById(id: string) {
		return getCalendarsArray().find((c) => c.id === id);
	},

	/**
	 * Get calendar color by ID (with fallback)
	 */
	getColor(id: string) {
		// Handle virtual birthday calendar
		if (id === BIRTHDAY_CALENDAR.id) {
			return BIRTHDAY_CALENDAR.color;
		}
		const calendar = getCalendarsArray().find((c) => c.id === id);
		return calendar?.color || '#3b82f6';
	},

	/**
	 * Toggle birthday calendar visibility
	 * (This updates the settings store, not the calendar itself)
	 */
	toggleBirthdaysVisibility() {
		settingsStore.set('showBirthdays', !settingsStore.showBirthdays);
	},

	/**
	 * Check if a calendar ID is the virtual birthday calendar
	 */
	isBirthdayCalendar(id: string) {
		return id === BIRTHDAY_CALENDAR.id;
	},

	/**
	 * Check if a calendar ID is the guest calendar
	 */
	isGuestCalendar(id: string) {
		return id === GUEST_CALENDAR.id;
	},

	/**
	 * Get the guest calendar ID
	 */
	get guestCalendarId() {
		return GUEST_CALENDAR.id;
	},
};
