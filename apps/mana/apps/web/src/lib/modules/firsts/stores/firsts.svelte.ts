import { firstTable } from '../collections';
import { toFirst } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import type {
	First,
	FirstCategory,
	FirstPriority,
	FirstStatus,
	LocalFirst,
	WouldRepeat,
} from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

export const firstsStore = {
	/** Create a new dream (something you want to experience). */
	async createDream(data: {
		title: string;
		category?: FirstCategory;
		motivation?: string | null;
		priority?: FirstPriority | null;
		personIds?: string[];
	}): Promise<First> {
		const id = crypto.randomUUID();
		const newLocal: LocalFirst = {
			id,
			title: data.title,
			status: 'dream',
			category: data.category ?? 'other',
			motivation: data.motivation ?? null,
			priority: data.priority ?? null,
			date: null,
			note: null,
			expectation: null,
			reality: null,
			rating: null,
			wouldRepeat: null,
			personIds: data.personIds ?? [],
			sharedWith: null,
			mediaIds: [],
			audioNoteId: null,
			placeId: null,
			isPinned: false,
			isArchived: false,
		};

		const plaintextSnapshot = toFirst(newLocal);
		await encryptRecord('firsts', newLocal);
		await firstTable.add(newLocal);
		emitDomainEvent('FirstCreated', 'firsts', 'firsts', newLocal.id, {
			firstId: newLocal.id,
			title: data.title ?? '',
			isLived: false,
		});
		return plaintextSnapshot;
	},

	/** Create a lived first directly (without prior dream). */
	async createLived(data: {
		title: string;
		category?: FirstCategory;
		date?: string;
		note?: string | null;
		expectation?: string | null;
		reality?: string | null;
		rating?: number | null;
		wouldRepeat?: WouldRepeat | null;
		personIds?: string[];
		sharedWith?: string | null;
		placeId?: string | null;
		mediaIds?: string[];
	}): Promise<First> {
		const id = crypto.randomUUID();
		const newLocal: LocalFirst = {
			id,
			title: data.title,
			status: 'lived',
			category: data.category ?? 'other',
			motivation: null,
			priority: null,
			date: data.date ?? todayIsoDate(),
			note: data.note ?? null,
			expectation: data.expectation ?? null,
			reality: data.reality ?? null,
			rating: data.rating ?? null,
			wouldRepeat: data.wouldRepeat ?? null,
			personIds: data.personIds ?? [],
			sharedWith: data.sharedWith ?? null,
			mediaIds: data.mediaIds ?? [],
			audioNoteId: null,
			placeId: data.placeId ?? null,
			isPinned: false,
			isArchived: false,
		};

		const plaintextSnapshot = toFirst(newLocal);
		await encryptRecord('firsts', newLocal);
		await firstTable.add(newLocal);
		return plaintextSnapshot;
	},

	/** Convert a dream to a lived first. */
	async markAsLived(
		id: string,
		data: {
			date?: string;
			note?: string | null;
			expectation?: string | null;
			reality?: string | null;
			rating?: number | null;
			wouldRepeat?: WouldRepeat | null;
			personIds?: string[];
			sharedWith?: string | null;
			placeId?: string | null;
			mediaIds?: string[];
		}
	) {
		const diff: Partial<LocalFirst> = {
			status: 'lived',
			date: data.date ?? todayIsoDate(),
			note: data.note ?? null,
			expectation: data.expectation ?? null,
			reality: data.reality ?? null,
			rating: data.rating ?? null,
			wouldRepeat: data.wouldRepeat ?? null,
			updatedAt: new Date().toISOString(),
		};
		if (data.personIds) diff.personIds = data.personIds;
		if (data.sharedWith !== undefined) diff.sharedWith = data.sharedWith;
		if (data.placeId !== undefined) diff.placeId = data.placeId;
		if (data.mediaIds) diff.mediaIds = data.mediaIds;

		await encryptRecord('firsts', diff);
		await firstTable.update(id, diff);
	},

	async updateFirst(
		id: string,
		data: Partial<
			Pick<
				LocalFirst,
				| 'title'
				| 'category'
				| 'motivation'
				| 'priority'
				| 'date'
				| 'note'
				| 'expectation'
				| 'reality'
				| 'rating'
				| 'wouldRepeat'
				| 'personIds'
				| 'sharedWith'
				| 'mediaIds'
				| 'audioNoteId'
				| 'placeId'
				| 'isPinned'
				| 'isArchived'
			>
		>
	) {
		const diff: Partial<LocalFirst> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('firsts', diff);
		await firstTable.update(id, diff);
	},

	async deleteFirst(id: string) {
		await firstTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async togglePin(id: string) {
		const first = await firstTable.get(id);
		if (!first) return;
		await firstTable.update(id, {
			isPinned: !first.isPinned,
			updatedAt: new Date().toISOString(),
		});
	},

	async archiveFirst(id: string) {
		await firstTable.update(id, {
			isArchived: true,
			updatedAt: new Date().toISOString(),
		});
	},
};
