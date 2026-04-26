/**
 * Attempts — mutation service for quiz play-throughs.
 *
 * Not encrypted: attempts carry only references + booleans + a score.
 * No user-typed content leaks here (answer text on `text` questions IS
 * user input, but it's compared at evaluate-time and then stored as the
 * boolean `correct` + the raw string echo for review). We keep the raw
 * textAnswer plaintext for now — if review of incorrect attempts ever
 * shows it should be encrypted, flip the registry entry.
 */

import { quizAttemptTable } from '../collections';
import { toAttempt } from '../queries';
import type { LocalQuizAttempt, AttemptAnswer, QuizAttempt } from '../types';

function now() {
	return new Date().toISOString();
}

export const attemptsStore = {
	async startAttempt(quizId: string): Promise<QuizAttempt> {
		const newLocal: LocalQuizAttempt = {
			id: crypto.randomUUID(),
			quizId,
			startedAt: now(),
			finishedAt: null,
			score: 0,
			answers: [],
		};
		const snapshot = toAttempt(newLocal);
		await quizAttemptTable.add(newLocal);
		return snapshot;
	},

	async finishAttempt(id: string, answers: AttemptAnswer[]) {
		const score =
			answers.length === 0 ? 0 : answers.filter((a) => a.correct).length / answers.length;
		await quizAttemptTable.update(id, {
			answers,
			score,
			finishedAt: now(),
		});
	},

	async deleteAttempt(id: string) {
		await quizAttemptTable.update(id, { deletedAt: now() });
	},
};
