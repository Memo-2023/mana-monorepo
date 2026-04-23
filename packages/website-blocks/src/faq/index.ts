import type { BlockSpec } from '../types';
import Faq from './Faq.svelte';
import FaqInspector from './FaqInspector.svelte';
import { FaqSchema, FAQ_DEFAULTS, type FaqProps, type FaqItem } from './schema';

export const faqBlockSpec: BlockSpec<FaqProps> = {
	type: 'faq',
	label: 'FAQ',
	icon: 'question',
	category: 'content',
	schema: FaqSchema,
	schemaVersion: 1,
	defaults: FAQ_DEFAULTS,
	Component: Faq,
	Inspector: FaqInspector,
};

export type { FaqProps, FaqItem };
export { FaqSchema, FAQ_DEFAULTS };
