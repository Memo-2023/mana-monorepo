import type { BlockSpec } from '../types';
import Cta from './Cta.svelte';
import CtaInspector from './CtaInspector.svelte';
import { CtaSchema, CTA_DEFAULTS, type CtaProps } from './schema';

export const ctaBlockSpec: BlockSpec<CtaProps> = {
	type: 'cta',
	label: 'Call-to-Action',
	icon: 'megaphone',
	category: 'content',
	schema: CtaSchema,
	schemaVersion: 1,
	defaults: CTA_DEFAULTS,
	Component: Cta,
	Inspector: CtaInspector,
};

export type { CtaProps };
export { CtaSchema, CTA_DEFAULTS };
