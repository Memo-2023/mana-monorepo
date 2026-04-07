/**
 * Events store — mutation-only service.
 *
 * Creates a TimeBlock + LocalSocialEvent pair so events show up in calendar
 * via the universal time view (sourceModule: 'events').
 */

import { db } from '$lib/data/database';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import type { LocalSocialEvent, EventStatus } from '../types';

let error = $state<string | null>(null);

export const eventsStore = {
	get error() {
		return error;
	},

	async createEvent(input: {
		title: string;
		description?: string | null;
		location?: string | null;
		locationUrl?: string | null;
		startTime: string;
		endTime: string;
		isAllDay?: boolean;
		hostContactId?: string | null;
		coverImage?: string | null;
		color?: string | null;
		capacity?: number | null;
		status?: EventStatus;
	}) {
		error = null;
		try {
			const eventId = crypto.randomUUID();

			const timeBlockId = await createBlock({
				startDate: input.startTime,
				endDate: input.endTime,
				allDay: input.isAllDay ?? false,
				kind: 'scheduled',
				type: 'event',
				sourceModule: 'events',
				sourceId: eventId,
				title: input.title,
				description: input.description ?? null,
				color: input.color ?? null,
			});

			const newLocal: LocalSocialEvent = {
				id: eventId,
				timeBlockId,
				title: input.title,
				description: input.description ?? null,
				location: input.location ?? null,
				locationUrl: input.locationUrl ?? null,
				hostContactId: input.hostContactId ?? null,
				coverImage: input.coverImage ?? null,
				color: input.color ?? null,
				capacity: input.capacity ?? null,
				isPublished: false,
				publicToken: null,
				status: input.status ?? 'draft',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			await db.table<LocalSocialEvent>('socialEvents').add(newLocal);
			return { success: true as const, id: eventId };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create event';
			return { success: false as const, error };
		}
	},

	async updateEvent(
		id: string,
		input: {
			title?: string;
			description?: string | null;
			location?: string | null;
			locationUrl?: string | null;
			startTime?: string;
			endTime?: string;
			isAllDay?: boolean;
			color?: string | null;
			capacity?: number | null;
			status?: EventStatus;
			coverImage?: string | null;
		}
	) {
		error = null;
		try {
			const event = await db.table<LocalSocialEvent>('socialEvents').get(id);
			if (!event) return { success: false as const, error: 'Event not found' };

			const blockUpdates: Record<string, unknown> = {};
			if (input.startTime !== undefined) blockUpdates.startDate = input.startTime;
			if (input.endTime !== undefined) blockUpdates.endDate = input.endTime;
			if (input.isAllDay !== undefined) blockUpdates.allDay = input.isAllDay;
			if (input.title !== undefined) blockUpdates.title = input.title;
			if (input.description !== undefined) blockUpdates.description = input.description;
			if (input.color !== undefined) blockUpdates.color = input.color;

			if (Object.keys(blockUpdates).length > 0) {
				await updateBlock(event.timeBlockId, blockUpdates);
			}

			const localData: Partial<LocalSocialEvent> = {
				updatedAt: new Date().toISOString(),
			};
			if (input.title !== undefined) localData.title = input.title;
			if (input.description !== undefined) localData.description = input.description;
			if (input.location !== undefined) localData.location = input.location;
			if (input.locationUrl !== undefined) localData.locationUrl = input.locationUrl;
			if (input.color !== undefined) localData.color = input.color;
			if (input.capacity !== undefined) localData.capacity = input.capacity;
			if (input.status !== undefined) localData.status = input.status;
			if (input.coverImage !== undefined) localData.coverImage = input.coverImage;

			await db.table('socialEvents').update(id, localData);
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update event';
			return { success: false as const, error };
		}
	},

	async deleteEvent(id: string) {
		error = null;
		try {
			const event = await db.table<LocalSocialEvent>('socialEvents').get(id);
			if (event?.timeBlockId) {
				await deleteBlock(event.timeBlockId);
			}
			await db.table('socialEvents').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete event';
			return { success: false as const, error };
		}
	},

	/**
	 * Local-only "publish" stub for Phase 1a.
	 * Just flips isPublished + assigns a placeholder token. Phase 1b will
	 * push the snapshot to mana-events and use a real server-issued token.
	 */
	async publishEvent(id: string) {
		error = null;
		try {
			const token =
				typeof crypto !== 'undefined' && 'randomUUID' in crypto
					? crypto.randomUUID().replace(/-/g, '').slice(0, 24)
					: Math.random().toString(36).slice(2, 26);

			await db.table('socialEvents').update(id, {
				isPublished: true,
				publicToken: token,
				status: 'published' satisfies EventStatus,
				updatedAt: new Date().toISOString(),
			});
			return { success: true as const, token };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to publish event';
			return { success: false as const, error };
		}
	},

	async unpublishEvent(id: string) {
		error = null;
		try {
			await db.table('socialEvents').update(id, {
				isPublished: false,
				publicToken: null,
				status: 'draft' satisfies EventStatus,
				updatedAt: new Date().toISOString(),
			});
			return { success: true as const };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to unpublish event';
			return { success: false as const, error };
		}
	},
};
