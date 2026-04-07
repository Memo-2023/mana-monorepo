/**
 * Reactive queries & pure helpers for Questions — uses Dexie liveQuery on the unified DB.
 *
 * Uses table names: qCollections, questions, answers.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalCollection, LocalQuestion, LocalAnswer } from './types';

// ─── Shared Types (inline to avoid cross-app dependency) ───

export interface Collection {
	id: string;
	name: string;
	description?: string;
	color: string;
	icon: string;
	isDefault: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	questionCount?: number;
}

export interface Question {
	id: string;
	collectionId?: string;
	title: string;
	description?: string;
	status: 'open' | 'researching' | 'answered' | 'archived';
	priority: 'low' | 'normal' | 'high' | 'urgent';
	tags: string[];
	researchDepth: 'quick' | 'standard' | 'deep';
	createdAt: string;
	updatedAt: string;
}

export interface Answer {
	id: string;
	questionId: string;
	researchResultId?: string;
	content: string;
	citations: Array<{ sourceId: string; text: string }>;
	rating?: number;
	isAccepted: boolean;
	createdAt: string;
	updatedAt: string;
}

export type QuestionStatus = Question['status'];
export type QuestionPriority = Question['priority'];
export type ResearchDepth = Question['researchDepth'];

// ─── Type Converters ───────────────────────────────────────

export function toCollection(local: LocalCollection): Collection {
	return {
		id: local.id,
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

export function toQuestion(local: LocalQuestion): Question {
	return {
		id: local.id,
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

export function toAnswer(local: LocalAnswer): Answer {
	return {
		id: local.id,
		questionId: local.questionId,
		researchResultId: local.researchResultId ?? undefined,
		content: local.content,
		citations: local.citations ?? [],
		rating: local.rating ?? undefined,
		isAccepted: local.isAccepted,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

/** All collections, sorted by sortOrder. Auto-updates on any change. */
export function useAllCollections() {
	return liveQuery(async () => {
		const locals = await db.table<LocalCollection>('qCollections').toArray();
		return locals
			.filter((c) => !c.deletedAt)
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map(toCollection);
	});
}

/** All questions. Auto-updates on any change. */
export function useAllQuestions() {
	return liveQuery(async () => {
		const locals = await db.table<LocalQuestion>('questions').toArray();
		const visible = locals.filter((q) => !q.deletedAt);
		const decrypted = await decryptRecords('questions', visible);
		return decrypted.map(toQuestion);
	});
}

/** All answers for a given question. */
export function useAnswersByQuestion(questionId: string) {
	return liveQuery(async () => {
		const locals = await db.table<LocalAnswer>('answers').toArray();
		const visible = locals.filter((a) => !a.deletedAt && a.questionId === questionId);
		const decrypted = await decryptRecords('answers', visible);
		return decrypted.map(toAnswer);
	});
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

/** Get a question by ID. */
export function getQuestionById(questions: Question[], id: string): Question | undefined {
	return questions.find((q) => q.id === id);
}

/** Get questions count per collection. */
export function getQuestionCountByCollection(questions: Question[], collectionId: string): number {
	return questions.filter((q) => q.collectionId === collectionId).length;
}
