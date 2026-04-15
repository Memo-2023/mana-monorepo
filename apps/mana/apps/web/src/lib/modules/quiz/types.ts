/**
 * Quiz module types.
 *
 * Three tables: `quizzes` (container), `quizQuestions` (per-quiz items),
 * `quizAttempts` (one row per play-through with per-question results).
 */

import type { BaseRecord } from '@mana/local-store';

export type QuestionType = 'single' | 'multi' | 'truefalse' | 'text';

export interface QuestionOption {
	id: string;
	text: string;
	isCorrect: boolean;
}

// ─── Local (Dexie) Records ─────────────────────────────────

export interface LocalQuiz extends BaseRecord {
	title: string;
	description: string | null;
	category: string | null;
	tags: string[];
	questionCount: number;
	isPinned: boolean;
	isArchived: boolean;
}

export interface LocalQuizQuestion extends BaseRecord {
	quizId: string;
	order: number;
	type: QuestionType;
	questionText: string;
	/** `single` / `multi` / `truefalse`: one entry per choice with isCorrect flag.
	 *  `text`: single entry whose `text` is the expected answer (case-insensitive compare). */
	options: QuestionOption[];
	explanation: string | null;
}

export interface AttemptAnswer {
	questionId: string;
	selectedOptionIds: string[];
	textAnswer: string | null;
	correct: boolean;
}

export interface LocalQuizAttempt extends BaseRecord {
	quizId: string;
	startedAt: string;
	finishedAt: string | null;
	score: number; // 0..1
	answers: AttemptAnswer[];
}

// ─── Public DTOs ───────────────────────────────────────────

export interface Quiz {
	id: string;
	title: string;
	description: string | null;
	category: string | null;
	tags: string[];
	questionCount: number;
	isPinned: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface QuizQuestion {
	id: string;
	quizId: string;
	order: number;
	type: QuestionType;
	questionText: string;
	options: QuestionOption[];
	explanation: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface QuizAttempt {
	id: string;
	quizId: string;
	startedAt: string;
	finishedAt: string | null;
	score: number;
	answers: AttemptAnswer[];
	createdAt: string;
	updatedAt: string;
}

// ─── Labels ────────────────────────────────────────────────

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
	single: 'Single Choice',
	multi: 'Multiple Choice',
	truefalse: 'Wahr / Falsch',
	text: 'Texteingabe',
};
