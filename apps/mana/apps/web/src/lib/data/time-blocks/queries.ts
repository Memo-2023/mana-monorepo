/**
 * Reactive Queries & Pure Helpers for TimeBlocks.
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes.
 * Components call these hooks at init time; no manual fetch/refresh needed.
 *
 * Note: useLiveQueryWithDefault takes (querier, default) — no deps array.
 * For parameterized queries, use raw liveQuery from Dexie instead.
 */

import { liveQuery } from 'dexie';
import { deriveUpdatedAt } from '$lib/data/sync';
import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalTimeBlock,
	TimeBlock,
	TimeBlockKind,
	TimeBlockType,
	TimeBlockSourceModule,
} from './types';
import { isSameDay, isWithinInterval } from 'date-fns';

// ─── Type Converter ──────────────────────────────────────

export function toTimeBlock(local: LocalTimeBlock): TimeBlock {
	return {
		id: local.id,
		startDate: local.startDate,
		endDate: local.endDate ?? null,
		allDay: local.allDay,
		isLive: local.isLive,
		timezone: local.timezone ?? null,
		recurrenceRule: local.recurrenceRule ?? null,
		kind: local.kind,
		type: local.type,
		sourceModule: local.sourceModule,
		sourceId: local.sourceId,
		linkedBlockId: local.linkedBlockId ?? null,
		parentBlockId: local.parentBlockId ?? null,
		recurrenceDate: local.recurrenceDate ?? null,
		isRecurrenceException: local.isRecurrenceException ?? false,
		title: local.title,
		description: local.description ?? null,
		color: local.color ?? null,
		icon: local.icon ?? null,
		projectId: local.projectId ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

// ─── Svelte 5 Reactive Hooks ─────────────────────────────

/** All non-deleted timeBlocks. Auto-updates on change. */
export function useAllTimeBlocks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalTimeBlock>('timeBlocks').toArray();
		const visible = locals.filter((b) => !b.deletedAt);
		const decrypted = await decryptRecords('timeBlocks', visible);
		return decrypted.map(toTimeBlock);
	}, [] as TimeBlock[]);
}

/**
 * All non-deleted timeBlocks within a date range.
 * Returns a raw Dexie liveQuery observable (use with $-subscribe in Svelte).
 */
export function timeBlocksInRange$(start: string, end: string) {
	return liveQuery(async () => {
		const locals = await db
			.table<LocalTimeBlock>('timeBlocks')
			.where('startDate')
			.between(start, end, true, true)
			.toArray();
		const visible = locals.filter((b) => !b.deletedAt);
		const decrypted = await decryptRecords('timeBlocks', visible);
		return decrypted.map(toTimeBlock);
	});
}

/** TimeBlock(s) for a specific source record (raw observable). */
export function timeBlocksBySource$(sourceModule: TimeBlockSourceModule, sourceId: string) {
	return liveQuery(async () => {
		const locals = await db
			.table<LocalTimeBlock>('timeBlocks')
			.where('[sourceModule+sourceId]')
			.equals([sourceModule, sourceId])
			.toArray();
		const visible = locals.filter((b) => !b.deletedAt);
		const decrypted = await decryptRecords('timeBlocks', visible);
		return decrypted.map(toTimeBlock);
	});
}

/** The currently live/running timeBlock (if any). */
export function useLiveTimeBlock() {
	return useLiveQueryWithDefault(
		async () => {
			// Can't index boolean in Dexie reliably, so scan and filter.
			// isLive is a plaintext column so we can find before decrypting,
			// then only decrypt the single row we actually need.
			const locals = await db.table<LocalTimeBlock>('timeBlocks').toArray();
			const active = locals.find((b) => b.isLive && !b.deletedAt);
			if (!active) return null;
			const [decrypted] = await decryptRecords('timeBlocks', [active]);
			return toTimeBlock(decrypted);
		},
		null as TimeBlock | null
	);
}

// ─── Pure Helpers ─────────────────────────────────────────

/** Convert a date string or Date to a Date. */
function toDate(dateStr: string | Date): Date {
	return typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
}

/** Get timeBlocks for a specific day. */
export function getBlocksForDay(blocks: TimeBlock[], date: Date): TimeBlock[] {
	return blocks.filter((block) => {
		const blockStart = toDate(block.startDate);
		const blockEnd = block.endDate ? toDate(block.endDate) : blockStart;

		if (block.allDay) {
			return (
				isWithinInterval(date, { start: blockStart, end: blockEnd }) || isSameDay(date, blockStart)
			);
		}

		// Point events: match day of startDate
		if (!block.endDate) {
			return isSameDay(date, blockStart);
		}

		// Range events: any overlap with the day
		const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
		const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
		return blockStart <= dayEnd && blockEnd >= dayStart;
	});
}

/** Get timeBlocks within a time range. */
export function getBlocksInRange(blocks: TimeBlock[], start: Date, end: Date): TimeBlock[] {
	return blocks.filter((block) => {
		const blockStart = toDate(block.startDate);
		const blockEnd = block.endDate ? toDate(block.endDate) : blockStart;
		return blockStart <= end && blockEnd >= start;
	});
}

/** Sort timeBlocks by start time. */
export function sortBlocksByTime(blocks: TimeBlock[]): TimeBlock[] {
	return [...blocks].sort(
		(a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
	);
}

/** Filter timeBlocks by kind. */
export function filterBlocksByKind(blocks: TimeBlock[], kind: TimeBlockKind): TimeBlock[] {
	return blocks.filter((b) => b.kind === kind);
}

/** Filter timeBlocks by type. */
export function filterBlocksByType(blocks: TimeBlock[], type: TimeBlockType): TimeBlock[] {
	return blocks.filter((b) => b.type === type);
}

/** Filter timeBlocks by visible types (for calendar filter toggles). */
export function filterBlocksByVisibleTypes(
	blocks: TimeBlock[],
	visibleTypes: Set<TimeBlockType>
): TimeBlock[] {
	return blocks.filter((b) => visibleTypes.has(b.type));
}

/** Find overlapping timeBlocks for a given range. */
export function findOverlaps(
	blocks: TimeBlock[],
	start: string,
	end: string,
	excludeId?: string
): TimeBlock[] {
	const rangeStart = new Date(start);
	const rangeEnd = new Date(end);

	return blocks.filter((block) => {
		if (block.id === excludeId) return false;
		if (block.allDay) return false;

		const blockStart = new Date(block.startDate);
		const blockEnd = block.endDate ? new Date(block.endDate) : blockStart;
		return blockStart < rangeEnd && blockEnd > rangeStart;
	});
}

/** Get the raw wall-clock duration in seconds (derived from start/end). */
export function getBlockDuration(block: TimeBlock): number {
	if (!block.endDate) return 0;
	return Math.max(
		0,
		(new Date(block.endDate).getTime() - new Date(block.startDate).getTime()) / 1000
	);
}

/** Find free time slots on a given day. */
export function findFreeSlots(
	blocks: TimeBlock[],
	date: Date,
	minDurationMinutes: number = 30,
	workStart: number = 8,
	workEnd: number = 18
): { start: Date; end: Date; durationMinutes: number }[] {
	// Get non-allday blocks for the day, sorted by start
	const dayBlocks = getBlocksForDay(blocks, date)
		.filter((b) => !b.allDay && b.endDate)
		.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

	const slots: { start: Date; end: Date; durationMinutes: number }[] = [];
	const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), workStart, 0, 0);
	const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), workEnd, 0, 0);

	let cursor = dayStart;

	for (const block of dayBlocks) {
		const blockStart = new Date(block.startDate);
		const blockEnd = new Date(block.endDate!);

		// Skip blocks outside working hours
		if (blockEnd <= dayStart || blockStart >= dayEnd) continue;

		const effectiveStart = blockStart < dayStart ? dayStart : blockStart;

		if (cursor < effectiveStart) {
			const gapMinutes = (effectiveStart.getTime() - cursor.getTime()) / 60000;
			if (gapMinutes >= minDurationMinutes) {
				slots.push({
					start: new Date(cursor),
					end: effectiveStart,
					durationMinutes: Math.round(gapMinutes),
				});
			}
		}

		const effectiveEnd = blockEnd > dayEnd ? dayEnd : blockEnd;
		if (effectiveEnd > cursor) {
			cursor = effectiveEnd;
		}
	}

	// Gap after last block until end of work
	if (cursor < dayEnd) {
		const gapMinutes = (dayEnd.getTime() - cursor.getTime()) / 60000;
		if (gapMinutes >= minDurationMinutes) {
			slots.push({ start: new Date(cursor), end: dayEnd, durationMinutes: Math.round(gapMinutes) });
		}
	}

	return slots;
}

/** Find the next free slot across multiple days. */
export function findNextFreeSlot(
	blocks: TimeBlock[],
	minDurationMinutes: number = 60,
	daysToSearch: number = 7,
	workStart: number = 8,
	workEnd: number = 18
): { start: Date; end: Date; durationMinutes: number } | null {
	const today = new Date();
	for (let d = 0; d < daysToSearch; d++) {
		const date = new Date(today);
		date.setDate(date.getDate() + d);
		const slots = findFreeSlots(blocks, date, minDurationMinutes, workStart, workEnd);
		if (slots.length > 0) {
			// For today, skip slots that have already started
			if (d === 0) {
				const now = new Date();
				const validSlot = slots.find((s) => s.start >= now);
				if (validSlot) return validSlot;
			} else {
				return slots[0];
			}
		}
	}
	return null;
}

/** Group timeBlocks by date string (YYYY-MM-DD). */
export function groupBlocksByDate(blocks: TimeBlock[]): Map<string, TimeBlock[]> {
	const map = new Map<string, TimeBlock[]>();
	for (const block of blocks) {
		const dateKey = block.startDate.split('T')[0];
		const group = map.get(dateKey);
		if (group) {
			group.push(block);
		} else {
			map.set(dateKey, [block]);
		}
	}
	return map;
}
