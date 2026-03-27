/**
 * Calendars Store — Local-First with IndexedDB
 *
 * All reads and writes go to IndexedDB first.
 * Same public API as before so components don't break.
 */

import type { Calendar, CreateCalendarInput, UpdateCalendarInput } from '@calendar/shared';
import { calendarCollection, type LocalCalendar } from '$lib/data/local-store';
import { BIRTHDAY_CALENDAR } from '$lib/api/birthdays';
import { settingsStore } from './settings.svelte';
import { CalendarEvents } from '@manacore/shared-utils/analytics';

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
	isVisible: true,
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

/** Convert a LocalCalendar (IndexedDB) to the shared Calendar type. */
function toCalendar(local: LocalCalendar): Calendar {
	return {
		id: local.id,
		userId: 'guest',
		name: local.name,
		color: local.color,
		isDefault: local.isDefault,
		isVisible: local.isVisible,
		timezone: local.timezone,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// Helper to safely get calendars array (Svelte 5 runes safety)
function getCalendarsArray(): Calendar[] {
	const arr = calendars ?? [];
	return Array.isArray(arr) ? arr : [];
}

// Derived: all calendars including virtual birthday calendar
const allCalendars = $derived.by(() => {
	const userCalendars = getCalendarsArray();
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
	 * Load calendars from IndexedDB.
	 */
	async fetchCalendars() {
		loading = true;
		error = null;
		try {
			const localCalendars = await calendarCollection.getAll();
			calendars = localCalendars.map(toCalendar);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch calendars';
			console.error('Failed to fetch calendars:', e);
			calendars = [];
		} finally {
			loading = false;
		}
		return { data: { calendars }, error: null };
	},

	/**
	 * Create a new calendar — writes to IndexedDB instantly.
	 */
	async createCalendar(data: CreateCalendarInput) {
		error = null;
		try {
			const newLocal: LocalCalendar = {
				id: crypto.randomUUID(),
				name: data.name,
				color: data.color ?? '#3B82F6',
				isDefault: data.isDefault ?? false,
				isVisible: data.isVisible ?? true,
				timezone: data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
			};

			const inserted = await calendarCollection.insert(newLocal);
			const newCalendar = toCalendar(inserted);
			calendars = [...calendars, newCalendar];
			CalendarEvents.calendarCreated();
			return { data: newCalendar, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to create calendar';
			error = msg;
			return { data: null, error: { message: msg } };
		}
	},

	/**
	 * Update a calendar — writes to IndexedDB instantly.
	 */
	async updateCalendar(id: string, data: UpdateCalendarInput) {
		error = null;
		try {
			const updated = await calendarCollection.update(id, data as Partial<LocalCalendar>);
			if (updated) {
				const updatedCalendar = toCalendar(updated);
				calendars = getCalendarsArray().map((c) => (c.id === id ? updatedCalendar : c));
				return { data: updatedCalendar, error: null };
			}
			return { data: null, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to update calendar';
			error = msg;
			return { data: null, error: { message: msg } };
		}
	},

	/**
	 * Delete a calendar — removes from IndexedDB instantly.
	 */
	async deleteCalendar(id: string) {
		error = null;
		try {
			await calendarCollection.delete(id);
			calendars = getCalendarsArray().filter((c) => c.id !== id);
			CalendarEvents.calendarDeleted();
			return { error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to delete calendar';
			error = msg;
			return { error: { message: msg } };
		}
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
		error = null;
		try {
			// Remove default from all others first
			for (const cal of getCalendarsArray()) {
				if (cal.isDefault && cal.id !== id) {
					await calendarCollection.update(cal.id, { isDefault: false } as Partial<LocalCalendar>);
				}
			}
			// Set the new default
			const updated = await calendarCollection.update(id, {
				isDefault: true,
			} as Partial<LocalCalendar>);
			if (updated) {
				calendars = getCalendarsArray().map((c) => ({
					...c,
					isDefault: c.id === id,
				}));
			}
			return { data: updated ? toCalendar(updated) : null, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to set default';
			error = msg;
			return { data: null, error: { message: msg } };
		}
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
		if (id === BIRTHDAY_CALENDAR.id) {
			return BIRTHDAY_CALENDAR.color;
		}
		const calendar = getCalendarsArray().find((c) => c.id === id);
		return calendar?.color || '#3b82f6';
	},

	/**
	 * Toggle birthday calendar visibility
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
		return id === 'personal-calendar';
	},

	/**
	 * Get the guest calendar ID
	 */
	get guestCalendarId() {
		return 'personal-calendar';
	},

	clear() {
		calendars = [];
		loading = false;
		error = null;
	},
};
