import type { ModuleConfig } from '$lib/data/module-registry';

export const questionsModuleConfig: ModuleConfig = {
	appId: 'questions',
	tables: [
		{ name: 'qCollections', syncName: 'collections' },
		{ name: 'questions' },
		{ name: 'answers' },
		{ name: 'questionTags' },
	],
};
