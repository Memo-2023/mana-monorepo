/**
 * Events Store — Mutation-Only Service
 *
 * Creates both a TimeBlock (time dimension) and a LocalEvent (domain data)
 * for each calendar event. Updates route time changes to the TimeBlock and
 * domain changes to the LocalEvent.
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { db } from '$lib/data/database';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import {
	defaultVisibilityFor,
	publishUnlistedSnapshot,
	revokeUnlistedSnapshot,
	type VisibilityLevel,
} from '@mana/shared-privacy';
import { buildUnlistedBlob } from '$lib/data/unlisted/resolvers';
import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import { timeBlockTable } from '$lib/data/time-blocks/collections';
import {
	cleanupFutureInstances,
	deleteAllInstances,
	regenerateForBlock,
} from '$lib/data/time-blocks/recurrence';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
import type { LocalEvent, CalendarEvent } from '../types';
import { CalendarEvents } from '@mana/shared-utils/analytics';

let error = $state<string | null>(null);
let draftEvent = $state<CalendarEvent | null>(null);

export const eventsStore = {
	get error() {
		return error;
	},
	get draftEvent() {
		return draftEvent;
	},

	/**
	 * Create a new event — creates TimeBlock + LocalEvent in IndexedDB.
	 */
	async createEvent(input: {
		calendarId: string;
		title: string;
		description?: string | null;
		startTime: string;
		endTime: string;
		isAllDay?: boolean;
		location?: string | null;
		recurrenceRule?: string | null;
		color?: string | null;
	}) {
		error = null;
		try {
			const eventId = crypto.randomUUID();

			// 1. Create TimeBlock (owns time dimension)
			const timeBlockId = await createBlock({
				startDate: input.startTime,
				endDate: input.endTime,
				allDay: input.isAllDay ?? false,
				recurrenceRule: input.recurrenceRule ?? null,
				kind: 'scheduled',
				type: 'event',
				sourceModule: 'calendar',
				sourceId: eventId,
				title: input.title,
				description: input.description ?? null,
				color: input.color ?? null,
			});

			// 2. Create LocalEvent (domain data)
			const newLocal: LocalEvent = {
				id: eventId,
				calendarId: input.calendarId,
				timeBlockId,
				title: input.title,
				description: input.description ?? null,
				location: input.location ?? null,
				color: input.color ?? null,
				reminders: null,
				visibility: defaultVisibilityFor(getActiveSpace()?.type),
				createdAt: new Date().toISOString(),
			};

			// title/description/location are encrypted at rest. createBlock
			// already handled the TimeBlock side; this wraps the LocalEvent
			// row before the Dexie write. UI never sees this mutation —
			// reads go through queries.ts which decrypts on the way out.
			await encryptRecord('events', newLocal);
			await db.table<LocalEvent>('events').add(newLocal);
			emitDomainEvent('CalendarEventCreated', 'calendar', 'events', eventId, {
				eventId,
				title: input.title,
				startTime: input.startTime,
				endTime: input.endTime,
				isAllDay: input.isAllDay ?? false,
				isRecurring: !!input.recurrenceRule,
				calendarId: input.calendarId,
				location: input.location,
			});
			CalendarEvents.eventCreated(!!input.recurrenceRule);
			return { success: true, data: { id: eventId, timeBlockId } };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create event';
			return { success: false, error };
		}
	},

	/**
	 * Update an event — routes time changes to TimeBlock, domain changes to LocalEvent.
	 */
	async updateEvent(
		id: string,
		input: {
			title?: string;
			description?: string | null;
			startTime?: string;
			endTime?: string;
			isAllDay?: boolean;
			location?: string | null;
			recurrenceRule?: string | null;
			color?: string | null;
			calendarId?: string;
		}
	) {
		error = null;
		try {
			// Get the event to find its timeBlockId
			const event = await db.table<LocalEvent>('events').get(id);
			if (!event) return { success: false, error: 'Event not found' };

			// Update TimeBlock for time-related fields
			const blockUpdates: Record<string, unknown> = {};
			if (input.startTime !== undefined) blockUpdates.startDate = input.startTime;
			if (input.endTime !== undefined) blockUpdates.endDate = input.endTime;
			if (input.isAllDay !== undefined) blockUpdates.allDay = input.isAllDay;
			if (input.recurrenceRule !== undefined) blockUpdates.recurrenceRule = input.recurrenceRule;
			if (input.title !== undefined) blockUpdates.title = input.title;
			if (input.description !== undefined) blockUpdates.description = input.description;
			if (input.color !== undefined) blockUpdates.color = input.color;

			if (Object.keys(blockUpdates).length > 0) {
				await updateBlock(event.timeBlockId, blockUpdates);
			}

			// Update LocalEvent for domain fields
			const localData: Partial<LocalEvent> = {};
			if (input.title !== undefined) localData.title = input.title;
			if (input.description !== undefined) localData.description = input.description;
			if (input.location !== undefined) localData.location = input.location;
			if (input.color !== undefined) localData.color = input.color;
			if (input.calendarId !== undefined) localData.calendarId = input.calendarId;

			await encryptRecord('events', localData);
			await db.table('events').update(id, localData);
			emitDomainEvent('CalendarEventUpdated', 'calendar', 'events', id, {
				eventId: id,
				fields: Object.keys(input).filter((k) => input[k as keyof typeof input] !== undefined),
			});
			CalendarEvents.eventUpdated();
			// If this event is shared via unlisted-link, keep the server
			// snapshot fresh so the shared view tracks local edits.
			void this.refreshUnlistedSnapshot(id);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update event';
			return { success: false, error };
		}
	},

	/**
	 * Update a single instance of a recurring event.
	 * Marks the instance as an exception so regeneration won't overwrite it.
	 */
	async updateSingleInstance(
		id: string,
		input: {
			title?: string;
			description?: string | null;
			startTime?: string;
			endTime?: string;
			isAllDay?: boolean;
			location?: string | null;
			color?: string | null;
		}
	) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (!event) return { success: false, error: 'Event not found' };

			// Mark the TimeBlock as an exception
			const blockUpdates: Record<string, unknown> = { isRecurrenceException: true };
			if (input.startTime !== undefined) blockUpdates.startDate = input.startTime;
			if (input.endTime !== undefined) blockUpdates.endDate = input.endTime;
			if (input.isAllDay !== undefined) blockUpdates.allDay = input.isAllDay;
			if (input.title !== undefined) blockUpdates.title = input.title;
			if (input.description !== undefined) blockUpdates.description = input.description;
			if (input.color !== undefined) blockUpdates.color = input.color;

			await updateBlock(event.timeBlockId, blockUpdates);

			// Update LocalEvent
			const localData: Partial<LocalEvent> = {};
			if (input.title !== undefined) localData.title = input.title;
			if (input.description !== undefined) localData.description = input.description;
			if (input.location !== undefined) localData.location = input.location;
			if (input.color !== undefined) localData.color = input.color;

			await encryptRecord('events', localData);
			await db.table('events').update(id, localData);
			CalendarEvents.eventUpdated();
			void this.refreshUnlistedSnapshot(id);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update instance';
			return { success: false, error };
		}
	},

	/**
	 * Update this and all future instances — updates the template rule/data
	 * and regenerates future instances.
	 */
	async updateAllFuture(
		id: string,
		input: {
			title?: string;
			description?: string | null;
			startTime?: string;
			endTime?: string;
			isAllDay?: boolean;
			location?: string | null;
			recurrenceRule?: string | null;
			color?: string | null;
		}
	) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (!event) return { success: false, error: 'Event not found' };

			// Find the template block (parent)
			const block = await timeBlockTable.get(event.timeBlockId);
			const templateBlockId = block?.parentBlockId || event.timeBlockId;

			// Update template block
			const blockUpdates: Record<string, unknown> = {};
			if (input.startTime !== undefined) blockUpdates.startDate = input.startTime;
			if (input.endTime !== undefined) blockUpdates.endDate = input.endTime;
			if (input.isAllDay !== undefined) blockUpdates.allDay = input.isAllDay;
			if (input.recurrenceRule !== undefined) blockUpdates.recurrenceRule = input.recurrenceRule;
			if (input.title !== undefined) blockUpdates.title = input.title;
			if (input.description !== undefined) blockUpdates.description = input.description;
			if (input.color !== undefined) blockUpdates.color = input.color;

			if (Object.keys(blockUpdates).length > 0) {
				await updateBlock(templateBlockId, blockUpdates);
			}

			// Update template's LocalEvent
			const templateEvent = await db
				.table<LocalEvent>('events')
				.where('timeBlockId')
				.equals(templateBlockId)
				.first();
			if (templateEvent) {
				const localData: Partial<LocalEvent> = {};
				if (input.title !== undefined) localData.title = input.title;
				if (input.description !== undefined) localData.description = input.description;
				if (input.location !== undefined) localData.location = input.location;
				if (input.color !== undefined) localData.color = input.color;
				await encryptRecord('events', localData);
				await db.table('events').update(templateEvent.id, localData);
			}

			// Regenerate future instances
			await regenerateForBlock(templateBlockId);
			CalendarEvents.eventUpdated();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update series';
			return { success: false, error };
		}
	},

	/**
	 * Delete a single instance of a recurring event.
	 */
	async deleteSingleInstance(id: string) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (event?.timeBlockId) {
				await deleteBlock(event.timeBlockId);
			}
			await db.table('events').update(id, {
				deletedAt: new Date().toISOString(),
			});
			CalendarEvents.eventDeleted();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete instance';
			return { success: false, error };
		}
	},

	/**
	 * Delete entire recurring series (template + all instances).
	 */
	async deleteAllInSeries(id: string) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (!event) return { success: false, error: 'Event not found' };

			const block = await timeBlockTable.get(event.timeBlockId);
			const templateBlockId = block?.parentBlockId || event.timeBlockId;

			// Delete all instances
			await deleteAllInstances(templateBlockId);

			// Soft-delete all LocalEvents linked to instance blocks
			const instanceBlocks = await timeBlockTable
				.where('parentBlockId')
				.equals(templateBlockId)
				.toArray();
			const blockIds = new Set([templateBlockId, ...instanceBlocks.map((b) => b.id)]);
			const allEvents = await db.table<LocalEvent>('events').toArray();
			const now = new Date().toISOString();
			for (const ev of allEvents) {
				if (blockIds.has(ev.timeBlockId) && !ev.deletedAt) {
					await db.table('events').update(ev.id, { deletedAt: now });
				}
			}

			// Delete template block itself
			await deleteBlock(templateBlockId);

			CalendarEvents.eventDeleted();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete series';
			return { success: false, error };
		}
	},

	/**
	 * Delete an event — soft-deletes both TimeBlock and LocalEvent.
	 */
	async deleteEvent(id: string) {
		error = null;
		try {
			const event = await db.table<LocalEvent>('events').get(id);
			if (event?.timeBlockId) {
				await deleteBlock(event.timeBlockId);
			}

			// If the event is shared via unlisted-link, revoke the server
			// snapshot before the local tombstone — the link should die
			// the moment the user deletes the record, not whenever the cron
			// happens to notice.
			if (event?.visibility === 'unlisted' && event.unlistedToken) {
				const jwt = await authStore.getValidToken();
				if (jwt) {
					try {
						await revokeUnlistedSnapshot({
							apiUrl: getManaApiUrl(),
							jwt,
							collection: 'events',
							recordId: id,
						});
					} catch (e) {
						console.error('[calendar/events] revoke on delete failed', e);
					}
				}
			}

			await db.table('events').update(id, {
				deletedAt: new Date().toISOString(),
			});
			emitDomainEvent('CalendarEventDeleted', 'calendar', 'events', id, {
				eventId: id,
				title: event?.title ?? '',
				wasRecurring: false,
			});
			CalendarEvents.eventDeleted();
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete event';
			return { success: false, error };
		}
	},

	/**
	 * Update tag IDs on an event (merge-safe).
	 */
	async updateTagIds(id: string, tagIds: string[]) {
		await db.table('events').update(id, {
			tagIds,
		});
	},

	// ========== Draft Event Methods ==========

	createDraftEvent(data: Partial<CalendarEvent>) {
		draftEvent = {
			id: '__draft__',
			calendarId: data.calendarId || '',
			timeBlockId: '__draft_block__',
			title: data.title || '',
			description: data.description || null,
			location: data.location || null,
			startTime: data.startTime || new Date().toISOString(),
			endTime: data.endTime || new Date().toISOString(),
			isAllDay: data.isAllDay || false,
			timezone: null,
			recurrenceRule: null,
			parentEventId: null,
			color: data.color || null,
			tagIds: data.tagIds || [],
			visibility: data.visibility ?? 'private',
			unlistedToken: data.unlistedToken ?? '',
			unlistedExpiresAt: data.unlistedExpiresAt ?? null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			blockType: 'event',
			sourceModule: 'calendar',
			sourceId: '__draft__',
			icon: null,
			isLive: false,
			projectId: null,
			linkedBlockId: null,
			parentBlockId: null,
			recurrenceDate: null,
		};
		return draftEvent;
	},

	updateDraftEvent(data: Partial<CalendarEvent>) {
		if (draftEvent) {
			draftEvent = { ...draftEvent, ...data };
		}
	},

	clearDraftEvent() {
		draftEvent = null;
	},

	isDraftEvent(eventId: string) {
		return eventId === '__draft__';
	},

	getParentEventId(eventId: string): string {
		if (eventId.includes('__recurrence__')) {
			return eventId.split('__recurrence__')[0];
		}
		return eventId;
	},

	/**
	 * Flip the event's visibility. Coordinates with the server-side
	 * unlisted-snapshots table when the transition involves the
	 * 'unlisted' level:
	 *
	 *   - private|space|public → unlisted:
	 *     build the whitelist blob, publish to mana-api, server returns
	 *     the authoritative token, store it on the Dexie record.
	 *   - unlisted → anything else:
	 *     revoke the server snapshot first, then clear the local token.
	 *
	 * Server call failures abort the flip so Dexie and server don't
	 * drift out of sync — the user sees an error and can retry. Emits
	 * the cross-module VisibilityChanged domain event for audit.
	 *
	 * See docs/plans/unlisted-sharing.md §4 (Store-Integration).
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		error = null;
		try {
			const existing = await db.table<LocalEvent>('events').get(id);
			if (!existing) return { success: false, error: 'Event not found' };
			const before: VisibilityLevel = existing.visibility ?? 'space';
			if (before === next) return { success: true };

			const now = new Date().toISOString();
			const patch: Partial<LocalEvent> = {
				visibility: next,
				visibilityChangedAt: now,
				visibilityChangedBy: getEffectiveUserId(),
			};

			// Server-authoritative token. Publish first; local update only
			// if the server accepted the snapshot so a share-link always
			// resolves to a real row.
			if (next === 'unlisted') {
				const blob = await buildUnlistedBlob('events', id);
				const jwt = await authStore.getValidToken();
				if (!jwt) return { success: false, error: 'Nicht eingeloggt' };
				const spaceId =
					(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
				const { token } = await publishUnlistedSnapshot({
					apiUrl: getManaApiUrl(),
					jwt,
					collection: 'events',
					recordId: id,
					spaceId,
					blob,
				});
				patch.unlistedToken = token;
				patch.unlistedExpiresAt = undefined;
			} else if (before === 'unlisted') {
				const jwt = await authStore.getValidToken();
				if (jwt) {
					await revokeUnlistedSnapshot({
						apiUrl: getManaApiUrl(),
						jwt,
						collection: 'events',
						recordId: id,
					});
				}
				patch.unlistedToken = undefined;
				patch.unlistedExpiresAt = undefined;
			}

			await db.table('events').update(id, patch);

			emitDomainEvent('VisibilityChanged', 'calendar', 'events', id, {
				recordId: id,
				collection: 'events',
				before,
				after: next,
			});
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to set visibility';
			return { success: false, error };
		}
	},

	/**
	 * Force-regenerate the unlisted token for an event. Revoke the
	 * existing snapshot, then publish a fresh one — server gives back
	 * a new token because the previous row is marked revoked. UI
	 * intent: "the old link is leaked or I want a clean slate".
	 *
	 * No-op if the event isn't currently 'unlisted'.
	 */
	async regenerateUnlistedToken(id: string) {
		const existing = await db.table<LocalEvent>('events').get(id);
		if (!existing || existing.visibility !== 'unlisted') {
			return { success: false, error: 'Event is not unlisted' };
		}
		const jwt = await authStore.getValidToken();
		if (!jwt) return { success: false, error: 'Nicht eingeloggt' };

		try {
			await revokeUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'events',
				recordId: id,
			});
			const blob = await buildUnlistedBlob('events', id);
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			const { token } = await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'events',
				recordId: id,
				spaceId,
				blob,
			});
			await db.table('events').update(id, {
				unlistedToken: token,
			});
			return { success: true, token };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to regenerate link';
			return { success: false, error };
		}
	},

	/**
	 * Set or clear the unlisted-share expiry. Re-publishes the snapshot
	 * with the new `expiresAt`; mirrors the value locally so the
	 * SharedLinkControls picker shows the right state without a server
	 * round-trip. No-op if the event isn't currently 'unlisted'.
	 */
	async setUnlistedExpiry(id: string, expiresAt: Date | null) {
		const existing = await db.table<LocalEvent>('events').get(id);
		if (!existing || existing.visibility !== 'unlisted') return;
		const jwt = await authStore.getValidToken();
		if (!jwt) return;
		try {
			const blob = await buildUnlistedBlob('events', id);
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'events',
				recordId: id,
				spaceId,
				blob,
				expiresAt,
			});
			await db.table('events').update(id, {
				unlistedExpiresAt: expiresAt ? expiresAt.toISOString() : undefined,
			});
		} catch (e) {
			console.error('[calendar/events] setUnlistedExpiry failed', e);
		}
	},

	/**
	 * Re-publish the unlisted snapshot for an event. Called by
	 * updateEvent/updateSingleInstance/etc. when the owning record is
	 * currently flagged 'unlisted' — keeps the share-link in sync with
	 * local edits to the whitelist fields.
	 *
	 * Fire-and-forget in practice: a failure logs but doesn't revert the
	 * edit. The next successful re-publish will heal any drift, and the
	 * user can re-flip visibility to force a fresh publish.
	 */
	async refreshUnlistedSnapshot(id: string) {
		const existing = await db.table<LocalEvent>('events').get(id);
		if (!existing || existing.visibility !== 'unlisted') return;
		try {
			const blob = await buildUnlistedBlob('events', id);
			const jwt = await authStore.getValidToken();
			if (!jwt) return;
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'events',
				recordId: id,
				spaceId,
				blob,
				// Preserve any existing expiry so a content edit doesn't
				// silently extend the link's lifetime.
				expiresAt: existing.unlistedExpiresAt ? new Date(existing.unlistedExpiresAt) : undefined,
			});
		} catch (e) {
			console.error('[calendar/events] refreshUnlistedSnapshot failed', e);
		}
	},
};
