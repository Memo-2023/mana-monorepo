import type { SiteTemplate } from './types';

/**
 * Blank-canvas template — one empty home page. For advanced users who
 * want to build from scratch without copying template content.
 */
export const blankTemplate: SiteTemplate = {
	id: 'blank',
	name: 'Leer',
	description: 'Eine leere Startseite — bau von Grund auf.',
	tag: 'leer',
	pages: [
		{
			path: '/',
			title: 'Start',
			order: 1024,
			blocks: [],
		},
	],
};
