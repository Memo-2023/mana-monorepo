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
import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { db } from '$lib/data/database';
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
		title: local.title,
		description: local.description ?? null,
		color: local.color ?? null,
		icon: local.icon ?? null,
		projectId: local.projectId ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Svelte 5 Reactive Hooks ─────────────────────────────

/** All non-deleted timeBlocks. Auto-updates on change. */
export function useAllTimeBlocks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalTimeBlock>('timeBlocks').toArray();
		return locals.filter((b) => !b.deletedAt).map(toTimeBlock);
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
		return locals.filter((b) => !b.deletedAt).map(toTimeBlock);
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
		return locals.filter((b) => !b.deletedAt).map(toTimeBlock);
	});
}

/** The currently live/running timeBlock (if any). */
export function useLiveTimeBlock() {
	return useLiveQueryWithDefault(
		async () => {
			// Can't index boolean in Dexie reliably, so scan and filter
			const locals = await db.table<LocalTimeBlock>('timeBlocks').toArray();
			const active = locals.find((b) => b.isLive && !b.deletedAt);
			return active ? toTimeBlock(active) : null;
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
