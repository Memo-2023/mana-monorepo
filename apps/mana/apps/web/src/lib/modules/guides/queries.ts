/**
 * Reactive Queries & Pure Helpers for Guides module.
 *
 * Reads from IndexedDB via Dexie liveQuery. Decrypts title/description/
 * content fields on the fly before handing to the UI.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalGuide,
	LocalSection,
	LocalStep,
	LocalRun,
	Guide,
	Section,
	Step,
	Run,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toGuide(local: LocalGuide): Guide {
	return {
		id: local.id,
		title: local.title,
		description: local.description,
		category: local.category,
		difficulty: local.difficulty,
		estimatedMinutes: local.estimatedMinutes,
		collectionId: local.collectionId,
		isPublished: local.isPublished,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toSection(local: LocalSection): Section {
	return {
		id: local.id,
		guideId: local.guideId,
		title: local.title,
		content: local.content,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toStep(local: LocalStep): Step {
	return {
		id: local.id,
		guideId: local.guideId,
		sectionId: local.sectionId,
		title: local.title,
		content: local.content,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toRun(local: LocalRun): Run {
	return {
		id: local.id,
		guideId: local.guideId,
		startedAt: local.startedAt,
		completedAt: local.completedAt,
		completedStepIds: local.completedStepIds,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllGuides() {
	return useScopedLiveQuery(async () => {
		const all = await scopedForModule<LocalGuide, string>('guides', 'guides').toArray();
		const visible = all.filter((g) => !g.deletedAt);
		const decrypted = await decryptRecords('guides', visible);
		return decrypted.map(toGuide).sort((a, b) => a.order - b.order);
	}, [] as Guide[]);
}

export function useGuide(id: () => string) {
	return useScopedLiveQuery(
		async () => {
			const guideId = id();
			if (!guideId) return null;
			const local = await db.table<LocalGuide>('guides').get(guideId);
			if (!local || local.deletedAt) return null;
			const [decrypted] = await decryptRecords('guides', [local]);
			return decrypted ? toGuide(decrypted) : null;
		},
		null as Guide | null
	);
}

export function useSections(guideId: () => string) {
	return useScopedLiveQuery(async () => {
		const gid = guideId();
		if (!gid) return [];
		const all = await db.table<LocalSection>('sections').where('guideId').equals(gid).toArray();
		const visible = all.filter((s) => !s.deletedAt);
		const decrypted = await decryptRecords('sections', visible);
		return decrypted.map(toSection).sort((a, b) => a.order - b.order);
	}, [] as Section[]);
}

export function useSteps(guideId: () => string) {
	return useScopedLiveQuery(async () => {
		const gid = guideId();
		if (!gid) return [];
		const all = await db.table<LocalStep>('steps').where('guideId').equals(gid).toArray();
		const visible = all.filter((s) => !s.deletedAt);
		const decrypted = await decryptRecords('steps', visible);
		return decrypted.map(toStep).sort((a, b) => a.order - b.order);
	}, [] as Step[]);
}

export function useLatestRun(guideId: () => string) {
	return useScopedLiveQuery(
		async () => {
			const gid = guideId();
			if (!gid) return null;
			const all = await db.table<LocalRun>('runs').where('guideId').equals(gid).toArray();
			const visible = all.filter((r) => !r.deletedAt);
			if (visible.length === 0) return null;
			visible.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
			return toRun(visible[0]);
		},
		null as Run | null
	);
}

export function useRunsByGuide() {
	return useScopedLiveQuery(async () => {
		const all = await scopedForModule<LocalRun, string>('guides', 'runs').toArray();
		const visible = all.filter((r) => !r.deletedAt);
		const map = new Map<string, Run>();
		// Keep only the latest run per guide
		for (const r of visible.sort((a, b) => b.startedAt.localeCompare(a.startedAt))) {
			if (!map.has(r.guideId)) {
				map.set(r.guideId, toRun(r));
			}
		}
		return map;
	}, new Map<string, Run>());
}

// ─── Pure Helpers ──────────────────────────────────────────

export function searchGuides(guides: Guide[], query: string): Guide[] {
	if (!query.trim()) return guides;
	const q = query.toLowerCase();
	return guides.filter(
		(g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
	);
}

export function getStepProgress(run: Run | null, totalSteps: number): number {
	if (!run || totalSteps === 0) return 0;
	return Math.round((run.completedStepIds.length / totalSteps) * 100);
}
