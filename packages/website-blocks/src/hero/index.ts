import type { BlockSpec } from '../types';
import Hero from './Hero.svelte';
import HeroInspector from './HeroInspector.svelte';
import { HeroSchema, HERO_DEFAULTS, type HeroProps } from './schema';

export const heroBlockSpec: BlockSpec<HeroProps> = {
	type: 'hero',
	label: 'Hero',
	icon: 'heading',
	category: 'content',
	schema: HeroSchema,
	schemaVersion: 1,
	defaults: HERO_DEFAULTS,
	Component: Hero,
	Inspector: HeroInspector,
};

export type { HeroProps };
export { HeroSchema, HERO_DEFAULTS };
