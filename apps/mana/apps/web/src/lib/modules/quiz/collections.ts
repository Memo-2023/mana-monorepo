/**
 * Quiz module — Dexie collection accessors and guest seed.
 */

import { db } from '$lib/data/database';
import type { LocalQuiz, LocalQuizQuestion, LocalQuizAttempt } from './types';

export const quizTable = db.table<LocalQuiz>('quizzes');
export const quizQuestionTable = db.table<LocalQuizQuestion>('quizQuestions');
export const quizAttemptTable = db.table<LocalQuizAttempt>('quizAttempts');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_QUIZ_ID = 'quiz-demo';

export const QUIZ_GUEST_SEED = {
	quizzes: [
		{
			id: DEMO_QUIZ_ID,
			title: 'Willkommen — Mini-Quiz',
			description: 'Drei Fragen, um alle Typen auszuprobieren.',
			category: 'Demo',
			tags: ['Start'],
			questionCount: 3,
			isPinned: true,
			isArchived: false,
		},
	] satisfies LocalQuiz[],
	quizQuestions: [
		{
			id: 'quiz-demo-q1',
			quizId: DEMO_QUIZ_ID,
			order: 0,
			type: 'single',
			questionText: 'Welche Hauptstadt gehört zu Frankreich?',
			options: [
				{ id: 'a', text: 'Berlin', isCorrect: false },
				{ id: 'b', text: 'Paris', isCorrect: true },
				{ id: 'c', text: 'Madrid', isCorrect: false },
				{ id: 'd', text: 'Rom', isCorrect: false },
			],
			explanation: 'Paris ist die Hauptstadt Frankreichs.',
		},
		{
			id: 'quiz-demo-q2',
			quizId: DEMO_QUIZ_ID,
			order: 1,
			type: 'truefalse',
			questionText: 'Die Erde ist eine Scheibe.',
			options: [
				{ id: 't', text: 'Wahr', isCorrect: false },
				{ id: 'f', text: 'Falsch', isCorrect: true },
			],
			explanation: null,
		},
		{
			id: 'quiz-demo-q3',
			quizId: DEMO_QUIZ_ID,
			order: 2,
			type: 'text',
			questionText: 'Wie heißt dieses Ökosystem? (Tipp: vier Buchstaben)',
			options: [{ id: 'answer', text: 'Mana', isCorrect: true }],
			explanation: 'Groß-/Kleinschreibung wird ignoriert.',
		},
	] satisfies LocalQuizQuestion[],
};
