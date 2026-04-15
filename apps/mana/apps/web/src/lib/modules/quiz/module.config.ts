import type { ModuleConfig } from '$lib/data/module-registry';

export const quizModuleConfig: ModuleConfig = {
	appId: 'quiz',
	tables: [
		{ name: 'quizzes' },
		{ name: 'quizQuestions', syncName: 'questions' },
		{ name: 'quizAttempts', syncName: 'attempts' },
	],
};
