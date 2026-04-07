/**
 * Event guests store — mutation-only service for the guest list of an event.
 */

import { db } from '$lib/data/database';
import type { LocalEventGuest, RsvpStatus } from '../types';

let error = $state<string | null>(null);

export const eventGuestsStore = {
	get error() {
		return error;
	},

	async addGuest(input: {
		eventId: string;
		name: string;
		email?: string | null;
		phone?: string | null;
		contactId?: string | null;
		rsvpStatus?: RsvpStatus;
		plusOnes?: number;
		note?: string | null;
	}) {
		error = null;
		try {
			const id = crypto.randomUUID();
			const newGuest: LocalEventGuest = {
				id,
				eventId: input.eventId,
				contactId: input.contactId ?? null,
				name: input.name,
				email: input.email ?? null,
				phone: input.phone ?? null,
				rsvpStatus: input.rsvpStatus ?? 'pending',
				rsvpAt: null,
				plusOnes: input.plusOnes ?? 0,
				note: input.note ?? null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			await db.table<LocalEventGuest>('eventGuests').add(newGuest);
			return { success: true as const, id };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add guest';
			return { success: false as const, error };
		}
	},

	async updateGuest(
		id: string,
		input: Partial<{
			name: string;
			email: string | null;
			phone: string | null;
			contactId: string | null;
			rsvpStatus: RsvpStatus;
			plusOnes: number;
			note: string | null;
		}>
	) {
		error = null;
		try {
			const data: Partial<LocalEventGuest> = {
				...input,
				updatedAt: new Date().toISOString(),
			};
			if (input.rsvpStatus !== undefined) {
				data.rsvpAt = new Date().toISOString();
			}
			await db.table('eventGuests').update(id, data);
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update guest';
			return { success: false as const, error };
		}
	},

	async setRsvp(id: string, status: RsvpStatus) {
		return this.updateGuest(id, { rsvpStatus: status });
	},

	async deleteGuest(id: string) {
		error = null;
		try {
			await db.table('eventGuests').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete guest';
			return { success: false as const, error };
		}
	},
};
