/**
 * Writing drafts store — mutation-only service for drafts + draft versions.
 *
 * Creating a draft always creates an initial empty version (v1) in the same
 * transaction so the UI can always render a "current version" without
 * having to handle a null/missing body. Live typing mutates the current
 * version in-place; `createCheckpointVersion` snapshots the current content
 * as a new numbered version. `restoreVersion` sets `currentVersionId` to an
 * older version without destroying history.
 *
 * Full-regeneration flows (M3+) will write new versions via the generations
 * store and then call `pointToVersion` — never append to an existing version.
 */

import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import {
	defaultVisibilityFor,
	generateUnlistedToken,
	type VisibilityLevel,
} from '@mana/shared-privacy';
import { draftTable, draftVersionTable } from '../collections';
import { toDraft, toDraftVersion } from '../queries';
import { LENGTH_PRESETS, DEFAULT_LANGUAGE } from '../constants';
import type {
	LocalDraft,
	LocalDraftVersion,
	DraftKind,
	DraftStatus,
	DraftBriefing,
	DraftReference,
	DraftStyleOverrides,
	DraftPublishTarget,
	DraftPublishModule,
} from '../types';

function wordCountOf(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

function defaultBriefing(kind: DraftKind, topic: string): DraftBriefing {
	return {
		topic,
		audience: null,
		tone: null,
		language: DEFAULT_LANGUAGE,
		targetLength: LENGTH_PRESETS[kind],
		extraInstructions: null,
		useResearch: false,
	};
}

export interface CreateDraftInput {
	kind: DraftKind;
	title: string;
	briefing?: Partial<DraftBriefing> & { topic: string };
	styleId?: string | null;
	references?: DraftReference[];
	initialContent?: string;
	status?: DraftStatus;
	isFavorite?: boolean;
}

export type UpdateDraftPatch = Partial<
	Pick<
		LocalDraft,
		| 'title'
		| 'kind'
		| 'status'
		| 'briefing'
		| 'styleId'
		| 'styleOverrides'
		| 'references'
		| 'isFavorite'
	>
>;

export const draftsStore = {
	/**
	 * Create a draft + its first (empty or pre-filled) version atomically.
	 * Returns the plaintext Draft snapshot + initial version id.
	 */
	async createDraft(input: CreateDraftInput) {
		const draftId = crypto.randomUUID();
		const versionId = crypto.randomUUID();
		const briefingInput = input.briefing ?? { topic: input.title };
		const briefing: DraftBriefing = {
			...defaultBriefing(input.kind, briefingInput.topic),
			...briefingInput,
		};
		const initialContent = input.initialContent ?? '';

		const newDraft: LocalDraft = {
			id: draftId,
			kind: input.kind,
			status: input.status ?? 'draft',
			title: input.title,
			briefing,
			styleId: input.styleId ?? null,
			styleOverrides: null,
			references: input.references ?? [],
			currentVersionId: versionId,
			publishedTo: [],
			isFavorite: input.isFavorite ?? false,
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
		};

		const newVersion: LocalDraftVersion = {
			id: versionId,
			draftId,
			versionNumber: 1,
			content: initialContent,
			wordCount: wordCountOf(initialContent),
			generationId: null,
			isAiGenerated: false,
			parentVersionId: null,
			summary: null,
		};

		const draftSnapshot = toDraft({ ...newDraft });
		const versionSnapshot = toDraftVersion({ ...newVersion });

		await encryptRecord('writingDrafts', newDraft);
		await encryptRecord('writingDraftVersions', newVersion);
		await draftTable.add(newDraft);
		await draftVersionTable.add(newVersion);

		emitDomainEvent('WritingDraftCreated', 'writing', 'writingDrafts', draftId, {
			draftId,
			kind: input.kind,
			title: input.title,
		});

		return { draft: draftSnapshot, version: versionSnapshot };
	},

	async updateDraft(id: string, patch: UpdateDraftPatch) {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('writingDrafts', wrapped);
		await draftTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async updateBriefing(id: string, briefingPatch: Partial<DraftBriefing>) {
		const existing = await draftTable.get(id);
		if (!existing) return;
		// briefing is in the encrypt-list — decrypt before merging or the
		// ciphertext blob spreads garbage into the patch.
		await decryptRecord('writingDrafts', existing);
		const merged: DraftBriefing = { ...existing.briefing, ...briefingPatch };
		await draftsStore.updateDraft(id, { briefing: merged });
	},

	async updateStyleOverrides(id: string, overrides: DraftStyleOverrides | null) {
		await draftsStore.updateDraft(id, { styleOverrides: overrides });
	},

	async setStatus(id: string, status: DraftStatus) {
		const existing = await draftTable.get(id);
		if (!existing || existing.status === status) return;
		await draftTable.update(id, {
			status,
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('WritingDraftStatusChanged', 'writing', 'writingDrafts', id, {
			draftId: id,
			before: existing.status,
			after: status,
		});
	},

	async toggleFavorite(id: string) {
		const existing = await draftTable.get(id);
		if (!existing) return;
		await draftTable.update(id, {
			isFavorite: !existing.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteDraft(id: string) {
		const now = new Date().toISOString();
		await draftTable.update(id, { deletedAt: now, updatedAt: now });
		// Soft-delete every version belonging to the draft so they stop
		// showing up in version-history queries. Generations we leave —
		// they're audit records and shouldn't disappear silently.
		const versions = await draftVersionTable.where('draftId').equals(id).toArray();
		await Promise.all(
			versions.map((v) => draftVersionTable.update(v.id, { deletedAt: now, updatedAt: now }))
		);
		emitDomainEvent('WritingDraftDeleted', 'writing', 'writingDrafts', id, { draftId: id });
	},

	/**
	 * In-place edit of the draft's current version. This is the path for
	 * live typing in the editor and for selection-refinement application;
	 * it does NOT create a new version record. Use `createCheckpointVersion`
	 * when the user wants to freeze the current state.
	 */
	async updateVersionContent(versionId: string, content: string) {
		const existing = await draftVersionTable.get(versionId);
		if (!existing) return;
		const wrapped: Record<string, unknown> = {
			content,
			wordCount: wordCountOf(content),
		};
		await encryptRecord('writingDraftVersions', wrapped);
		const now = new Date().toISOString();
		await draftVersionTable.update(versionId, { ...wrapped, updatedAt: now });
		// Bump the owning draft's updatedAt so ListView sorting reflects
		// the edit even though nothing on the draft itself changed.
		await draftTable.update(existing.draftId, { updatedAt: now });
	},

	/**
	 * Take the current content of `sourceVersionId` and copy it into a
	 * new version with the next versionNumber; point the draft at it.
	 * Used by the "Als Checkpoint speichern" button.
	 */
	async createCheckpointVersion(
		draftId: string,
		sourceVersionId: string,
		opts: { isAiGenerated?: boolean; generationId?: string | null; summary?: string | null } = {}
	) {
		const source = await draftVersionTable.get(sourceVersionId);
		if (!source) throw new Error(`Version ${sourceVersionId} not found`);
		// content is encrypted — decrypt so the checkpoint copies plaintext,
		// not the ciphertext blob.
		await decryptRecord('writingDraftVersions', source);
		const existing = await draftVersionTable.where('draftId').equals(draftId).toArray();
		const nextNumber = Math.max(0, ...existing.map((v) => v.versionNumber)) + 1;

		const newVersion: LocalDraftVersion = {
			id: crypto.randomUUID(),
			draftId,
			versionNumber: nextNumber,
			content: source.content,
			wordCount: source.wordCount,
			generationId: opts.generationId ?? null,
			isAiGenerated: opts.isAiGenerated ?? false,
			parentVersionId: sourceVersionId,
			summary: opts.summary ?? null,
		};
		const snapshot = toDraftVersion({ ...newVersion });
		await encryptRecord('writingDraftVersions', newVersion);
		await draftVersionTable.add(newVersion);
		await draftTable.update(draftId, {
			currentVersionId: newVersion.id,
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent(
			'WritingDraftVersionCreated',
			'writing',
			'writingDraftVersions',
			newVersion.id,
			{
				draftId,
				versionId: newVersion.id,
				versionNumber: nextNumber,
				isAiGenerated: newVersion.isAiGenerated,
			}
		);
		return snapshot;
	},

	/**
	 * Restore an older version as the draft's current version. Does NOT
	 * destroy newer versions — the version history still shows them so
	 * the user can re-restore. Implemented as a pointer flip, not a copy,
	 * because the user wants the old text back verbatim.
	 */
	async restoreVersion(draftId: string, versionId: string) {
		const version = await draftVersionTable.get(versionId);
		if (!version || version.draftId !== draftId) {
			throw new Error(`Version ${versionId} does not belong to draft ${draftId}`);
		}
		await draftTable.update(draftId, {
			currentVersionId: versionId,
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('WritingDraftVersionReverted', 'writing', 'writingDrafts', draftId, {
			draftId,
			restoredVersionId: versionId,
			versionNumber: version.versionNumber,
		});
	},

	/**
	 * Record that a draft has been handed off to another module (M10
	 * Publish-Hooks). Idempotent per (module, targetId) pair — the same
	 * destination doesn't accumulate duplicate rows if the user exports
	 * twice. Emits a cross-module event so the Workbench timeline can
	 * surface the hand-off.
	 */
	async recordPublish(draftId: string, target: DraftPublishModule, targetId: string) {
		const existing = await draftTable.get(draftId);
		if (!existing) return;
		const publishedTo = existing.publishedTo ?? [];
		const now = new Date().toISOString();
		const next: DraftPublishTarget[] = [
			...publishedTo.filter((t) => !(t.module === target && t.targetId === targetId)),
			{ module: target, targetId, publishedAt: now },
		];
		await draftTable.update(draftId, {
			publishedTo: next,
			updatedAt: now,
		});
		emitDomainEvent('WritingDraftPublished', 'writing', 'writingDrafts', draftId, {
			draftId,
			module: target,
			targetId,
		});
	},

	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await draftTable.get(id);
		if (!existing) throw new Error(`Draft ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'space';
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalDraft> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId(),
			updatedAt: now,
		};
		if (next === 'unlisted' && !existing.unlistedToken) {
			patch.unlistedToken = generateUnlistedToken();
		} else if (next !== 'unlisted' && existing.unlistedToken) {
			patch.unlistedToken = undefined;
		}
		await draftTable.update(id, patch);
		emitDomainEvent('VisibilityChanged', 'writing', 'writingDrafts', id, {
			recordId: id,
			collection: 'writingDrafts',
			before,
			after: next,
		});
	},
};
