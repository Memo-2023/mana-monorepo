/**
 * Unlisted-snapshot resolvers — client-side blob builders.
 *
 * When a user flips a record to `visibility === 'unlisted'`, the store
 * calls `buildUnlistedBlob(collection, recordId)` here to produce the
 * whitelist-filtered plaintext payload that gets pushed to the
 * unlisted-snapshots table via `publishUnlistedSnapshot`.
 *
 * Whitelist is mandatory per module. What isn't listed explicitly does
 * NOT make it into the snapshot — protection against accidentally
 * leaking encrypted fields like description / guest-lists / private
 * notes. Same principle as `website/embeds.ts` for public snapshots.
 *
 * See docs/plans/unlisted-sharing.md §3.
 */

import { db } from '$lib/data/database';
import { decryptRecord } from '$lib/data/crypto';
import type { LocalEvent } from '$lib/modules/calendar/types';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

export class UnsupportedCollectionError extends Error {
	constructor(collection: string) {
		super(`Unlisted sharing is not supported for collection "${collection}"`);
		this.name = 'UnsupportedCollectionError';
	}
}

export class RecordNotFoundError extends Error {
	constructor(collection: string, recordId: string) {
		super(`${collection}/${recordId} not found`);
		this.name = 'RecordNotFoundError';
	}
}

/**
 * Build the whitelist-filtered blob for a record. Dispatcher —
 * delegates to per-collection builders.
 */
export async function buildUnlistedBlob(
	collection: string,
	recordId: string
): Promise<Record<string, unknown>> {
	switch (collection) {
		case 'events':
			return buildEventBlob(recordId);
		default:
			throw new UnsupportedCollectionError(collection);
	}
}

/**
 * Calendar event → snapshot blob.
 *
 * Whitelist: title, location, startTime, endTime, allDay, timezone.
 * Decryption happens client-side here (events table carries encrypted
 * title/description/location). Time dimension comes from the linked
 * TimeBlock — LocalEvent only stores the `timeBlockId` reference.
 *
 * NOT inlined:
 *   - description  (often holds agenda, private notes, guest info)
 *   - reminders    (implementation detail)
 *   - tagIds       (internal labels)
 *   - calendarId   (internal routing)
 *   - color        (cosmetic, the share page picks its own scheme)
 */
async function buildEventBlob(recordId: string): Promise<Record<string, unknown>> {
	const raw = await db.table<LocalEvent>('events').get(recordId);
	if (!raw || raw.deletedAt) {
		throw new RecordNotFoundError('events', recordId);
	}

	const decrypted = (await decryptRecord('events', { ...raw })) as LocalEvent;

	let startTime: string | null = null;
	let endTime: string | null = null;
	let isAllDay = false;
	let timezone: string | null = null;

	if (decrypted.timeBlockId) {
		const block = await db.table<LocalTimeBlock>('timeBlocks').get(decrypted.timeBlockId);
		if (block && !block.deletedAt) {
			startTime = block.startDate;
			endTime = block.endDate ?? block.startDate;
			isAllDay = block.allDay;
			timezone = block.timezone ?? null;
		}
	}

	if (!startTime || !endTime) {
		throw new Error(`Event ${recordId} is missing a time-block — cannot build share snapshot`);
	}

	return {
		// Keep the field names stable — the SSR renderer (SharedEventView)
		// reads these directly.
		title: decrypted.title,
		location: decrypted.location ?? null,
		startTime,
		endTime,
		isAllDay,
		timezone,
	};
}
