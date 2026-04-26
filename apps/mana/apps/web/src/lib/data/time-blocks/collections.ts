/**
 * TimeBlock module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalTimeBlock, LocalTimeBlockTag } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const timeBlockTable = db.table<LocalTimeBlock>('timeBlocks');
export const timeBlockTagTable = db.table<LocalTimeBlockTag>('timeBlockTags');

// ─── Guest Seed ────────────────────────────────────────────

export const TIME_BLOCK_GUEST_SEED = {
	timeBlocks: (() => {
		const now = new Date();
		const nowISO = now.toISOString();
		const today10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
		const today11 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrow14 = new Date(
			tomorrow.getFullYear(),
			tomorrow.getMonth(),
			tomorrow.getDate(),
			14,
			0,
			0
		);
		const tomorrow15 = new Date(
			tomorrow.getFullYear(),
			tomorrow.getMonth(),
			tomorrow.getDate(),
			15,
			30,
			0
		);

		return [
			{
				id: 'sample-tb-event-1',
				startDate: today10.toISOString(),
				endDate: today11.toISOString(),
				allDay: false,
				isLive: false,
				timezone: null,
				recurrenceRule: null,
				kind: 'scheduled' as const,
				type: 'event' as const,
				sourceModule: 'calendar' as const,
				sourceId: 'sample-event-1',
				linkedBlockId: null,
				title: 'Willkommen bei Kalender!',
				description:
					'Dies ist ein Beispieltermin. Tippe darauf, um ihn zu bearbeiten oder zu löschen.',
				color: null,
				icon: null,
				projectId: null,
				createdAt: nowISO,
			},
			{
				id: 'sample-tb-event-2',
				startDate: tomorrow14.toISOString(),
				endDate: tomorrow15.toISOString(),
				allDay: false,
				isLive: false,
				timezone: null,
				recurrenceRule: null,
				kind: 'scheduled' as const,
				type: 'event' as const,
				sourceModule: 'calendar' as const,
				sourceId: 'sample-event-2',
				linkedBlockId: null,
				title: 'Mittagessen mit Freunden',
				description: null,
				color: null,
				icon: null,
				projectId: null,
				createdAt: nowISO,
			},
		] satisfies LocalTimeBlock[];
	})(),
	timeBlockTags: [] as LocalTimeBlockTag[],
};
