/**
 * TimeBlock Service — shared CRUD helper called by all module stores.
 *
 * Module stores create both their domain record and a timeBlock in the same
 * Dexie transaction to keep them consistent.
 */

import { db } from '$lib/data/database';
import { timeBlockTable } from './collections';
import type { LocalTimeBlock, CreateTimeBlockInput, UpdateTimeBlockInput } from './types';

/** Create a new timeBlock and return its ID. */
export async function createBlock(input: CreateTimeBlockInput): Promise<string> {
	const now = new Date().toISOString();
	const id = crypto.randomUUID();

	const block: LocalTimeBlock = {
		id,
		startDate: input.startDate,
		endDate: input.endDate ?? null,
		allDay: input.allDay ?? false,
		isLive: input.isLive ?? false,
		timezone: input.timezone ?? null,
		recurrenceRule: input.recurrenceRule ?? null,
		kind: input.kind,
		type: input.type,
		sourceModule: input.sourceModule,
		sourceId: input.sourceId,
		linkedBlockId: input.linkedBlockId ?? null,
		title: input.title,
		description: input.description ?? null,
		color: input.color ?? null,
		icon: input.icon ?? null,
		projectId: input.projectId ?? null,
		createdAt: now,
		updatedAt: now,
	};

	await timeBlockTable.add(block);
	return id;
}

/** Update an existing timeBlock. */
export async function updateBlock(id: string, input: UpdateTimeBlockInput): Promise<void> {
	const now = new Date().toISOString();
	await timeBlockTable.update(id, {
		...input,
		updatedAt: now,
	});
}

/** Soft-delete a timeBlock. */
export async function deleteBlock(id: string): Promise<void> {
	const now = new Date().toISOString();
	await timeBlockTable.update(id, {
		deletedAt: now,
		updatedAt: now,
	});
}

/** Link a scheduled block to a logged block (plan vs. reality). */
export async function linkBlocks(scheduledId: string, loggedId: string): Promise<void> {
	const now = new Date().toISOString();
	await db.transaction('rw', timeBlockTable, async () => {
		await timeBlockTable.update(scheduledId, { linkedBlockId: loggedId, updatedAt: now });
		await timeBlockTable.update(loggedId, { linkedBlockId: scheduledId, updatedAt: now });
	});
}

/** Get a single timeBlock by ID. */
export async function getBlock(id: string): Promise<LocalTimeBlock | undefined> {
	const block = await timeBlockTable.get(id);
	if (block?.deletedAt) return undefined;
	return block;
}
