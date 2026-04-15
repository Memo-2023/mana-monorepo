/**
 * Quiz module — barrel exports.
 */

export { quizzesStore } from './stores/quizzes.svelte';
export { attemptsStore } from './stores/attempts.svelte';

export {
	useAllQuizzes,
	useQuiz,
	useQuestions,
	useAttempts,
	toQuiz,
	toQuestion,
	toAttempt,
	evaluateAnswer,
	computeScore,
	searchQuizzes,
	blankOption,
} from './queries';

export { quizTable, quizQuestionTable, quizAttemptTable, QUIZ_GUEST_SEED } from './collections';

export { QUESTION_TYPE_LABELS } from './types';
export type {
	LocalQuiz,
	LocalQuizQuestion,
	LocalQuizAttempt,
	Quiz,
	QuizQuestion,
	QuizAttempt,
	QuestionOption,
	QuestionType,
	AttemptAnswer,
} from './types';
