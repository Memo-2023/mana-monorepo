/**
 * Calendars Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations (create, update, delete).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import type { LocalCalendar } from '../types';
import type { Calendar } from '../types';
import { toCalendar } from '../queries';

let error = $state<string | null>(null);

export const calendarsStore = {
	get error() {
		return error;
	},

	/**
	 * Create a new calendar -- writes to IndexedDB instantly.
	 */
	async createCalendar(input: {
		name: string;
		color?: string;
		isDefault?: boolean;
		isVisible?: boolean;
		timezone?: string;
	}) {
		error = null;
		try {
			const newLocal: LocalCalendar = {
				id: crypto.randomUUID(),
				name: input.name,
				color: input.color ?? '#3B82F6',
				isDefault: input.isDefault ?? false,
				isVisible: input.isVisible ?? true,
				timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			await db.table<LocalCalendar>('calendars').add(newLocal);
			return { success: true, data: toCalendar(newLocal) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create calendar';
			return { success: false, error };
		}
	},

	/**
	 * Update a calendar -- writes to IndexedDB instantly.
	 */
	async updateCalendar(id: string, input: Partial<Omit<LocalCalendar, 'id'>>) {
		error = null;
		try {
			await db.table('calendars').update(id, {
				...input,
				updatedAt: new Date().toISOString(),
			});
			const updated = await db.table<LocalCalendar>('calendars').get(id);
			if (updated) {
				return { success: true, data: toCalendar(updated) };
			}
			return { success: false, error: 'Calendar not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update calendar';
			return { success: false, error };
		}
	},

	/**
	 * Delete a calendar -- soft-deletes from IndexedDB instantly.
	 */
	async deleteCalendar(id: string) {
		error = null;
		try {
			await db.table('calendars').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete calendar';
			return { success: false, error };
		}
	},

	/**
	 * Toggle calendar visibility.
	 */
	async toggleVisibility(id: string, calendars: Calendar[]) {
		const calendar = calendars.find((c) => c.id === id);
		if (!calendar) return { success: false, error: 'Calendar not found' };
		return this.updateCalendar(id, { isVisible: !calendar.isVisible });
	},

	/**
	 * Set a calendar as the default.
	 */
	async setAsDefault(id: string, calendars: Calendar[]) {
		error = null;
		try {
			for (const cal of calendars) {
				if (cal.isDefault && cal.id !== id) {
					await db.table('calendars').update(cal.id, {
						isDefault: false,
						updatedAt: new Date().toISOString(),
					});
				}
			}
			await db.table('calendars').update(id, {
				isDefault: true,
				updatedAt: new Date().toISOString(),
			});
			const updated = await db.table<LocalCalendar>('calendars').get(id);
			return { success: true, data: updated ? toCalendar(updated) : null };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to set default';
			return { success: false, error };
		}
	},
};
