/**
 * Unified Recurrence Engine — RRULE expansion + materialization.
 *
 * One system for all modules: Calendar events, Tasks, Habits.
 * Uses rrule.js for RFC 5545 RRULE expansion.
 *
 * Hybrid approach:
 * - Materialized: real TimeBlocks for the next 30 days (stored in DB)
 * - Virtual: on-the-fly expansion for calendar views beyond 30 days
 */

import { RRule } from 'rrule';
import { db } from '$lib/data/database';
import { timeBlockTable } from './collections';
import { createBlock, deleteBlock } from './service';
import type { LocalTimeBlock } from './types';
import type { HabitSchedule } from '$lib/modules/habits/types';

// ─── RRULE Expansion ─────────────────────────────────────

/** Expand an RRULE string to concrete dates within a range. */
export function expandRule(rruleStr: string, dtstart: Date, rangeStart: Date, rangeEnd: Date): Date[] {
	const rule = RRule.fromString(`DTSTART:${formatRRuleDate(dtstart)}\n${rruleStr}`);
	return rule.between(rangeStart, rangeEnd, true);
}

/** Format a Date for RRULE DTSTART (YYYYMMDDTHHMMSSZ). */
function formatRRuleDate(date: Date): string {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// ─── HabitSchedule ↔ RRULE Conversion ────────────────────

const DAY_MAP: Record<number, string> = {
	0: 'SU',
	1: 'MO',
	2: 'TU',
	3: 'WE',
	4: 'TH',
	5: 'FR',
	6: 'SA',
};

const REVERSE_DAY_MAP: Record<string, number> = {
	SU: 0,
	MO: 1,
	TU: 2,
	WE: 3,
	TH: 4,
	FR: 5,
	SA: 6,
};

/** Convert a HabitSchedule to an RRULE string. */
export function habitScheduleToRRule(schedule: HabitSchedule): string {
	if (schedule.days.length === 7) return 'RRULE:FREQ=DAILY';
	const byDay = schedule.days.map((d) => DAY_MAP[d]).join(',');
	return `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`;
}

/** Convert an RRULE string back to a HabitSchedule (best-effort). */
export function rruleToHabitSchedule(rrule: string): HabitSchedule | null {
	const clean = rrule.replace(/^RRULE:/, '');
	if (clean.includes('FREQ=DAILY')) {
		return { days: [0, 1, 2, 3, 4, 5, 6] };
	}
	const byDayMatch = clean.match(/BYDAY=([A-Z,]+)/);
	if (!byDayMatch) return null;
	const days = byDayMatch[1].split(',').map((d) => REVERSE_DAY_MAP[d]).filter((d) => d !== undefined);
	return { days: days.sort() };
}

// ─── Materialization ─────────────────────────────────────

/**
 * Materialize recurring TimeBlocks for the next N days.
 * Creates real instances in the DB for each occurrence.
 * Skips existing instances and exceptions.
 */
export async function materializeRecurringBlocks(daysAhead: number = 30): Promise<number> {
	const allBlocks = await timeBlockTable.toArray();

	// Find "template" blocks: have recurrenceRule, no parentBlockId (not instances themselves)
	const templates = allBlocks.filter(
		(b) => b.recurrenceRule && !b.deletedAt && !b.parentBlockId
	);

	if (templates.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const horizon = new Date(today);
	horizon.setDate(horizon.getDate() + daysAhead);

	// Build set of existing instances to avoid duplicates
	const existingInstances = allBlocks.filter((b) => b.parentBlockId && !b.deletedAt);
	const existingKeys = new Set(
		existingInstances.map((b) => `${b.parentBlockId}|${b.recurrenceDate}`)
	);

	let created = 0;

	for (const template of templates) {
		const dtstart = new Date(template.startDate);
		const rruleStr = template.recurrenceRule!.replace(/^RRULE:/, '');
		let dates: Date[];

		try {
			dates = expandRule(`RRULE:${rruleStr}`, dtstart, today, horizon);
		} catch {
			continue; // Skip invalid rules
		}

		// Calculate duration from template
		const templateDurationMs = template.endDate
			? new Date(template.endDate).getTime() - new Date(template.startDate).getTime()
			: 3600000; // default 1h

		// Extract time from template
		const templateHours = dtstart.getHours();
		const templateMinutes = dtstart.getMinutes();

		for (const date of dates) {
			const dateStr = date.toISOString().split('T')[0];
			const key = `${template.id}|${dateStr}`;

			if (existingKeys.has(key)) continue;

			// Set time from template
			const instanceStart = new Date(date);
			instanceStart.setHours(templateHours, templateMinutes, 0, 0);
			const instanceEnd = new Date(instanceStart.getTime() + templateDurationMs);

			await createBlock({
				startDate: instanceStart.toISOString(),
				endDate: instanceEnd.toISOString(),
				allDay: template.allDay,
				kind: template.kind,
				type: template.type,
				sourceModule: template.sourceModule,
				sourceId: template.sourceId,
				title: template.title,
				description: template.description ?? null,
				color: template.color ?? null,
				icon: template.icon ?? null,
				projectId: template.projectId ?? null,
				recurrenceRule: null, // instances don't have their own rule
			});

			// Set parentBlockId and recurrenceDate on the created block
			// (createBlock doesn't support these fields directly, so update after)
			const lastBlock = (await timeBlockTable.orderBy('createdAt').last())!;
			await timeBlockTable.update(lastBlock.id, {
				parentBlockId: template.id,
				recurrenceDate: dateStr,
			} as Partial<LocalTimeBlock>);

			existingKeys.add(key);
			created++;
		}
	}

	return created;
}

/**
 * Regenerate instances for a specific recurring block after rule change.
 * Deletes future non-exception instances and re-materializes.
 */
export async function regenerateForBlock(
	templateBlockId: string,
	daysAhead: number = 30
): Promise<void> {
	// Delete future non-exception instances
	await cleanupFutureInstances(templateBlockId);
	// Re-materialize
	await materializeRecurringBlocks(daysAhead);
}

/**
 * Delete future instances of a recurring block (preserving exceptions).
 */
export async function cleanupFutureInstances(templateBlockId: string): Promise<void> {
	const today = new Date().toISOString().split('T')[0];
	const instances = await timeBlockTable
		.where('parentBlockId')
		.equals(templateBlockId)
		.toArray();

	for (const instance of instances) {
		if (instance.deletedAt) continue;
		if ((instance as Record<string, unknown>).isRecurrenceException) continue;
		if (instance.recurrenceDate && instance.recurrenceDate >= today) {
			await deleteBlock(instance.id);
		}
	}
}

/**
 * Delete all instances of a recurring block (including exceptions).
 * Used when deleting the recurring event entirely.
 */
export async function deleteAllInstances(templateBlockId: string): Promise<void> {
	const instances = await timeBlockTable
		.where('parentBlockId')
		.equals(templateBlockId)
		.toArray();

	for (const instance of instances) {
		if (!instance.deletedAt) {
			await deleteBlock(instance.id);
		}
	}
}

// ─── Virtual Expansion (for calendar views >30 days) ─────

export interface VirtualTimeBlock {
	id: string; // synthetic: {parentId}__recurrence__{date}
	parentBlockId: string;
	recurrenceDate: string;
	startDate: string;
	endDate: string | null;
	allDay: boolean;
	isLive: false;
	kind: string;
	type: string;
	sourceModule: string;
	sourceId: string;
	title: string;
	description: string | null;
	color: string | null;
	icon: string | null;
	projectId: string | null;
	recurrenceRule: string | null;
	linkedBlockId: null;
	isVirtual: true;
	createdAt: string;
	updatedAt: string;
}

/**
 * Expand recurring templates into virtual blocks for a date range.
 * Only generates blocks that don't already exist as materialized instances.
 */
export function expandTemplatesVirtually(
	templates: LocalTimeBlock[],
	existingBlocks: LocalTimeBlock[],
	rangeStart: string,
	rangeEnd: string
): VirtualTimeBlock[] {
	const existingKeys = new Set(
		existingBlocks
			.filter((b) => b.parentBlockId)
			.map((b) => `${b.parentBlockId}|${(b as Record<string, unknown>).recurrenceDate}`)
	);

	const virtuals: VirtualTimeBlock[] = [];
	const start = new Date(rangeStart);
	const end = new Date(rangeEnd);

	for (const template of templates) {
		if (!template.recurrenceRule || template.deletedAt) continue;

		const dtstart = new Date(template.startDate);
		const rruleStr = template.recurrenceRule.replace(/^RRULE:/, '');
		let dates: Date[];

		try {
			dates = expandRule(`RRULE:${rruleStr}`, dtstart, start, end);
		} catch {
			continue;
		}

		const durationMs = template.endDate
			? new Date(template.endDate).getTime() - dtstart.getTime()
			: 3600000;
		const templateHours = dtstart.getHours();
		const templateMinutes = dtstart.getMinutes();

		for (const date of dates) {
			const dateStr = date.toISOString().split('T')[0];
			const key = `${template.id}|${dateStr}`;
			if (existingKeys.has(key)) continue;

			const instanceStart = new Date(date);
			instanceStart.setHours(templateHours, templateMinutes, 0, 0);
			const instanceEnd = new Date(instanceStart.getTime() + durationMs);

			virtuals.push({
				id: `${template.id}__recurrence__${dateStr}`,
				parentBlockId: template.id,
				recurrenceDate: dateStr,
				startDate: instanceStart.toISOString(),
				endDate: instanceEnd.toISOString(),
				allDay: template.allDay,
				isLive: false,
				kind: template.kind,
				type: template.type,
				sourceModule: template.sourceModule,
				sourceId: template.sourceId,
				title: template.title,
				description: template.description ?? null,
				color: template.color ?? null,
				icon: template.icon ?? null,
				projectId: template.projectId ?? null,
				recurrenceRule: template.recurrenceRule,
				linkedBlockId: null,
				isVirtual: true,
				createdAt: template.createdAt ?? new Date().toISOString(),
				updatedAt: template.updatedAt ?? new Date().toISOString(),
			});
		}
	}

	return virtuals;
}
