/**
 * Quizzes + Questions — mutation-only service.
 *
 * Encrypted fields: title, description, category, tags on quizzes;
 * questionText, explanation, options on quizQuestions.
 */

import { quizTable, quizQuestionTable } from '../collections';
import { toQuiz } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import { defaultVisibilityFor, type VisibilityLevel } from '@mana/shared-privacy';
import type { LocalQuiz, LocalQuizQuestion, Quiz, QuestionOption, QuestionType } from '../types';

function now() {
	return new Date().toISOString();
}

export const quizzesStore = {
	async createQuiz(data: {
		title: string;
		description?: string | null;
		category?: string | null;
		tags?: string[];
	}): Promise<Quiz> {
		const newLocal: LocalQuiz = {
			id: crypto.randomUUID(),
			title: data.title,
			description: data.description ?? null,
			category: data.category ?? null,
			tags: data.tags ?? [],
			questionCount: 0,
			isPinned: false,
			isArchived: false,
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
		};
		const snapshot = toQuiz(newLocal);
		await encryptRecord('quizzes', newLocal);
		await quizTable.add(newLocal);
		return snapshot;
	},

	async updateQuiz(
		id: string,
		data: Partial<
			Pick<LocalQuiz, 'title' | 'description' | 'category' | 'tags' | 'isPinned' | 'isArchived'>
		>
	) {
		const diff: Partial<LocalQuiz> = { ...data, updatedAt: now() };
		await encryptRecord('quizzes', diff);
		await quizTable.update(id, diff);
	},

	async deleteQuiz(id: string) {
		await quizTable.update(id, { deletedAt: now(), updatedAt: now() });
		const questions = await quizQuestionTable.where('quizId').equals(id).toArray();
		await Promise.all(
			questions.map((q) => quizQuestionTable.update(q.id, { deletedAt: now(), updatedAt: now() }))
		);
	},

	async togglePin(id: string) {
		const quiz = await quizTable.get(id);
		if (!quiz) return;
		await quizTable.update(id, { isPinned: !quiz.isPinned, updatedAt: now() });
	},

	/**
	 * Flip a quiz's visibility. v1 supports private/space/public only —
	 * unlisted-share for quizzes is a candidate for a future milestone
	 * (share a single quiz with a friend) but not wired yet.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await quizTable.get(id);
		if (!existing) throw new Error(`Quiz ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'space';
		if (before === next) return;

		const stamp = now();
		await quizTable.update(id, {
			visibility: next,
			visibilityChangedAt: stamp,
			visibilityChangedBy: getEffectiveUserId(),
			updatedAt: stamp,
		});

		emitDomainEvent('VisibilityChanged', 'quiz', 'quizzes', id, {
			recordId: id,
			collection: 'quizzes',
			before,
			after: next,
		});
	},

	// ── Questions ──────────────────────────────────────────

	async addQuestion(
		quizId: string,
		data: {
			type: QuestionType;
			questionText: string;
			options: QuestionOption[];
			explanation?: string | null;
		}
	) {
		const existing = await quizQuestionTable.where('quizId').equals(quizId).count();
		const newLocal: LocalQuizQuestion = {
			id: crypto.randomUUID(),
			quizId,
			order: existing,
			type: data.type,
			questionText: data.questionText,
			options: data.options,
			explanation: data.explanation ?? null,
		};
		await encryptRecord('quizQuestions', newLocal);
		await quizQuestionTable.add(newLocal);
		await this.recountQuestions(quizId);
	},

	async updateQuestion(
		id: string,
		data: Partial<
			Pick<LocalQuizQuestion, 'type' | 'questionText' | 'options' | 'explanation' | 'order'>
		>
	) {
		const diff: Partial<LocalQuizQuestion> = { ...data, updatedAt: now() };
		await encryptRecord('quizQuestions', diff);
		await quizQuestionTable.update(id, diff);
	},

	async deleteQuestion(id: string) {
		const q = await quizQuestionTable.get(id);
		if (!q) return;
		await quizQuestionTable.update(id, { deletedAt: now(), updatedAt: now() });
		await this.recountQuestions(q.quizId);
	},

	async recountQuestions(quizId: string) {
		const live = (await quizQuestionTable.where('quizId').equals(quizId).toArray()).filter(
			(q) => !q.deletedAt
		);
		await quizTable.update(quizId, { questionCount: live.length, updatedAt: now() });
	},
};
