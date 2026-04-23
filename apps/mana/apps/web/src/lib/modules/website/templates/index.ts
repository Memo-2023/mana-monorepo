import { portfolioTemplate } from './portfolio';
import { linktreeTemplate } from './linktree';
import { eventTemplate } from './event';
import { blankTemplate } from './blank';
import type { SiteTemplate } from './types';

export const SITE_TEMPLATES: readonly SiteTemplate[] = [
	portfolioTemplate,
	linktreeTemplate,
	eventTemplate,
	blankTemplate,
];

const BY_ID: Record<string, SiteTemplate> = (() => {
	const map: Record<string, SiteTemplate> = {};
	for (const tpl of SITE_TEMPLATES) map[tpl.id] = tpl;
	return map;
})();

export function getTemplate(id: string): SiteTemplate | undefined {
	return BY_ID[id];
}

export type { SiteTemplate, SiteTemplatePage, SiteTemplateBlock } from './types';
