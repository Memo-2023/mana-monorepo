/**
 * Reactive Queries & Pure Filter Helpers for Questions
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	collectionCollection,
	questionCollection,
	answerCollection,
	type LocalCollection,
	type LocalQuestion,
	type LocalAnswer,
} from './local-store';
import type { Collection, Question } from '$lib/types';

// ─── Type Converters ────────────────────────────────────────

/** Convert a LocalCollection (IndexedDB record) to the shared Collection type. */
export function toCollection(local: LocalCollection): Collection {
	return {
		id: local.id,
		userId: 'local',
		name: local.name,
		description: local.description ?? undefined,
		color: local.color,
		icon: local.icon,
		isDefault: local.isDefault,
		sortOrder: local.sortOrder,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert a LocalQuestion (IndexedDB record) to the shared Question type. */
export function toQuestion(local: LocalQuestion): Question {
	return {
		id: local.id,
		userId: 'local',
		collectionId: local.collectionId ?? undefined,
		title: local.title,
		description: local.description ?? undefined,
		status: local.status,
		priority: local.priority,
		tags: local.tags ?? [],
		researchDepth: local.researchDepth,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks (call during component init) ──────────

/** All collections, sorted by sortOrder. Auto-updates on any change. */
export function useAllCollections() {
	return useLiveQueryWithDefault(async () => {
		const locals = await collectionCollection.getAll(undefined, {
			sortBy: 'sortOrder',
			sortDirection: 'asc',
		});
		return locals.map(toCollection);
	}, [] as Collection[]);
}

/** All questions. Auto-updates on any change. */
export function useAllQuestions() {
	return useLiveQueryWithDefault(async () => {
		const locals = await questionCollection.getAll();
		return locals.map(toQuestion);
	}, [] as Question[]);
}

/** All answers for a given question. */
export function useAnswersByQuestion(questionId: string) {
	return useLiveQueryWithDefault(async () => {
		const locals = await answerCollection.getAll();
		return locals.filter((a) => a.questionId === questionId);
	}, [] as LocalAnswer[]);
}

// ─── Pure Filter Functions (for $derived) ───────────────────

/** Filter questions by collection ID. */
export function filterByCollection(questions: Question[], collectionId: string | null): Question[] {
	if (!collectionId) return questions;
	return questions.filter((q) => q.collectionId === collectionId);
}

/** Filter questions by status. */
export function filterByStatus(questions: Question[], status: string): Question[] {
	if (!status) return questions;
	return questions.filter((q) => q.status === status);
}

/** Filter questions by search query across title, description, and tags. */
export function searchQuestions(questions: Question[], query: string): Question[] {
	if (!query.trim()) return questions;
	const search = query.toLowerCase().trim();
	return questions.filter(
		(q) =>
			q.title.toLowerCase().includes(search) ||
			q.description?.toLowerCase().includes(search) ||
			q.tags?.some((t: string) => t.toLowerCase().includes(search))
	);
}
