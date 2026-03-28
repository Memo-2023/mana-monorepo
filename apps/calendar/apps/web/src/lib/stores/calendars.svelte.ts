/**
 * Calendars Store — Mutations Only
 *
 * Reads come from useLiveQuery (see $lib/data/queries.ts).
 * This store only handles writes to IndexedDB.
 */

import type { Calendar, CreateCalendarInput, UpdateCalendarInput } from '@calendar/shared';
import { calendarCollection, type LocalCalendar } from '$lib/data/local-store';
import { BIRTHDAY_CALENDAR } from '$lib/api/birthdays';
import { settingsStore } from './settings.svelte';
import { CalendarEvents } from '@manacore/shared-utils/analytics';
import { toCalendar } from '$lib/data/queries';

// Mutation error state
let error = $state<string | null>(null);

export const calendarsStore = {
	get error() {
		return error;
	},
	get birthdayCalendarId() {
		return BIRTHDAY_CALENDAR.id;
	},
	get guestCalendarId() {
		return 'personal-calendar';
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
			CalendarEvents.calendarDeleted();
			return { error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to delete calendar';
			error = msg;
			return { error: { message: msg } };
		}
	},

	/**
	 * Toggle calendar visibility (needs current calendars from context)
	 */
	async toggleVisibility(id: string, calendars: Calendar[]) {
		const calendar = calendars.find((c) => c.id === id);
		if (!calendar) return;
		return this.updateCalendar(id, { isVisible: !calendar.isVisible });
	},

	/**
	 * Set a calendar as the default (needs current calendars from context)
	 */
	async setAsDefault(id: string, calendars: Calendar[]) {
		error = null;
		try {
			// Remove default from all others first
			for (const cal of calendars) {
				if (cal.isDefault && cal.id !== id) {
					await calendarCollection.update(cal.id, { isDefault: false } as Partial<LocalCalendar>);
				}
			}
			// Set the new default
			const updated = await calendarCollection.update(id, {
				isDefault: true,
			} as Partial<LocalCalendar>);
			return { data: updated ? toCalendar(updated) : null, error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to set default';
			error = msg;
			return { data: null, error: { message: msg } };
		}
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
};
