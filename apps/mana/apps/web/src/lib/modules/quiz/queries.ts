/**
 * Quiz — reactive queries, type converters, pure helpers.
 *
 * Content fields (title, description, questionText, explanation, options)
 * are encrypted at rest. Queries decrypt the visible slice before mapping
 * to public DTOs. Attempts stay plaintext (only scores + timestamps +
 * AttemptAnswer payloads, which hold no user-typed content).
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalQuiz,
	LocalQuizQuestion,
	LocalQuizAttempt,
	Quiz,
	QuizQuestion,
	QuizAttempt,
	QuestionOption,
	AttemptAnswer,
} from './types';

// ─── Converters ────────────────────────────────────────────

export function toQuiz(local: LocalQuiz): Quiz {
	return {
		id: local.id,
		title: local.title,
		description: local.description,
		category: local.category,
		tags: local.tags ?? [],
		questionCount: local.questionCount ?? 0,
		isPinned: local.isPinned ?? false,
		isArchived: local.isArchived ?? false,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toQuestion(local: LocalQuizQuestion): QuizQuestion {
	return {
		id: local.id,
		quizId: local.quizId,
		order: local.order,
		type: local.type,
		questionText: local.questionText,
		options: local.options ?? [],
		explanation: local.explanation,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toAttempt(local: LocalQuizAttempt): QuizAttempt {
	return {
		id: local.id,
		quizId: local.quizId,
		startedAt: local.startedAt,
		finishedAt: local.finishedAt,
		score: local.score ?? 0,
		answers: local.answers ?? [],
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllQuizzes() {
	return useLiveQueryWithDefault(async () => {
		const visible = (await db.table<LocalQuiz>('quizzes').toArray()).filter(
			(q) => !q.deletedAt && !q.isArchived
		);
		const decrypted = await decryptRecords('quizzes', visible);
		return decrypted.map(toQuiz).sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			return b.updatedAt.localeCompare(a.updatedAt);
		});
	}, [] as Quiz[]);
}

export function useQuiz(id: string) {
	return useLiveQueryWithDefault(
		async () => {
			const local = await db.table<LocalQuiz>('quizzes').get(id);
			if (!local || local.deletedAt) return null;
			const [decrypted] = await decryptRecords('quizzes', [local]);
			return decrypted ? toQuiz(decrypted) : null;
		},
		null as Quiz | null
	);
}

export function useQuestions(quizId: string) {
	return useLiveQueryWithDefault(async () => {
		const visible = (
			await db.table<LocalQuizQuestion>('quizQuestions').where('quizId').equals(quizId).toArray()
		).filter((q) => !q.deletedAt);
		const decrypted = await decryptRecords('quizQuestions', visible);
		return decrypted.map(toQuestion).sort((a, b) => a.order - b.order);
	}, [] as QuizQuestion[]);
}

export function useAttempts(quizId: string) {
	return useLiveQueryWithDefault(async () => {
		const visible = (
			await db.table<LocalQuizAttempt>('quizAttempts').where('quizId').equals(quizId).toArray()
		).filter((a) => !a.deletedAt);
		return visible.map(toAttempt).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
	}, [] as QuizAttempt[]);
}

// ─── Scoring ───────────────────────────────────────────────

/**
 * Evaluate a single answer against a question. Pure — drives both the live
 * Play view and the post-hoc attempt summary.
 */
export function evaluateAnswer(
	question: QuizQuestion,
	selectedOptionIds: string[],
	textAnswer: string | null
): boolean {
	if (question.type === 'text') {
		const expected = question.options[0]?.text?.trim().toLowerCase() ?? '';
		const given = (textAnswer ?? '').trim().toLowerCase();
		return expected.length > 0 && given === expected;
	}
	const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
	const selected = new Set(selectedOptionIds);
	if (correctIds.size !== selected.size) return false;
	for (const id of correctIds) if (!selected.has(id)) return false;
	return true;
}

export function computeScore(answers: AttemptAnswer[]): number {
	if (answers.length === 0) return 0;
	const correct = answers.filter((a) => a.correct).length;
	return correct / answers.length;
}

// ─── Helpers ───────────────────────────────────────────────

export function searchQuizzes(quizzes: Quiz[], query: string): Quiz[] {
	if (!query.trim()) return quizzes;
	const q = query.toLowerCase();
	return quizzes.filter((quiz) => {
		const hay = [quiz.title, quiz.description, quiz.category, ...(quiz.tags ?? [])]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return hay.includes(q);
	});
}

export function blankOption(): QuestionOption {
	return { id: crypto.randomUUID(), text: '', isCorrect: false };
}
