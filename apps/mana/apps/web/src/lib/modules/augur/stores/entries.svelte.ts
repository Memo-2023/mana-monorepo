import { augurEntriesTable } from '../collections';
import { toAugurEntry } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import { generateUnlistedToken, type VisibilityLevel } from '@mana/shared-privacy';
import { getEffectiveUserId } from '$lib/data/current-user';
import type {
	AugurEntry,
	AugurKind,
	AugurOutcome,
	AugurSourceCategory,
	AugurVibe,
	LocalAugurEntry,
} from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

export const augurStore = {
	async createEntry(data: {
		kind: AugurKind;
		source: string;
		sourceCategory: AugurSourceCategory;
		claim: string;
		vibe: AugurVibe;
		feltMeaning?: string | null;
		expectedOutcome?: string | null;
		expectedBy?: string | null;
		probability?: number | null;
		encounteredAt?: string;
		tags?: string[];
		relatedDreamId?: string | null;
		relatedDecisionId?: string | null;
		livingOracleSnapshot?: string | null;
		isPrivate?: boolean;
	}): Promise<AugurEntry> {
		const id = crypto.randomUUID();
		const newLocal: LocalAugurEntry = {
			id,
			kind: data.kind,
			source: data.source,
			sourceCategory: data.sourceCategory,
			claim: data.claim,
			vibe: data.vibe,
			feltMeaning: data.feltMeaning ?? null,
			expectedOutcome: data.expectedOutcome ?? null,
			expectedBy: data.expectedBy ?? null,
			probability: data.probability ?? null,
			outcome: 'open',
			outcomeNote: null,
			resolvedAt: null,
			encounteredAt: data.encounteredAt ?? todayIsoDate(),
			tags: data.tags ?? [],
			relatedDreamId: data.relatedDreamId ?? null,
			relatedDecisionId: data.relatedDecisionId ?? null,
			livingOracleSnapshot: data.livingOracleSnapshot ?? null,
			isPrivate: data.isPrivate ?? true,
			isArchived: false,
			visibility: 'private',
		};

		const plaintextSnapshot = toAugurEntry(newLocal);
		await encryptRecord('augurEntries', newLocal);
		await augurEntriesTable.add(newLocal);
		return plaintextSnapshot;
	},

	async updateEntry(
		id: string,
		data: Partial<
			Pick<
				LocalAugurEntry,
				| 'source'
				| 'sourceCategory'
				| 'claim'
				| 'vibe'
				| 'feltMeaning'
				| 'expectedOutcome'
				| 'expectedBy'
				| 'probability'
				| 'tags'
				| 'isPrivate'
				| 'relatedDreamId'
				| 'relatedDecisionId'
			>
		>
	) {
		const diff: Partial<LocalAugurEntry> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('augurEntries', diff);
		await augurEntriesTable.update(id, diff);
	},

	async resolveEntry(id: string, outcome: AugurOutcome, note?: string | null) {
		const diff: Partial<LocalAugurEntry> = {
			outcome,
			outcomeNote: note ?? null,
			resolvedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('augurEntries', diff);
		await augurEntriesTable.update(id, diff);
	},

	async archiveEntry(id: string) {
		await augurEntriesTable.update(id, {
			isArchived: true,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteEntry(id: string) {
		await augurEntriesTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/**
	 * Flip the visibility level. M6 wires the local field + token-allocation;
	 * the unlisted-snapshot publish/revoke pipeline (server-side blob store)
	 * is a follow-up — until then, 'unlisted' just allocates a local token so
	 * the share URL is stable when we wire the backend.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await augurEntriesTable.get(id);
		if (!existing) return;

		const userId = getEffectiveUserId();
		const now = new Date().toISOString();
		const diff: Partial<LocalAugurEntry> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: userId ?? undefined,
			updatedAt: now,
		};

		if (next === 'unlisted') {
			if (!existing.unlistedToken) diff.unlistedToken = generateUnlistedToken();
		} else {
			if (existing.unlistedToken) {
				diff.unlistedToken = undefined;
				diff.unlistedExpiresAt = null;
			}
		}

		await augurEntriesTable.update(id, diff);
	},
};
