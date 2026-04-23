import { z } from 'zod';

export const HeroSchema = z.object({
	eyebrow: z.string().max(120).default(''),
	title: z.string().min(1).max(240),
	subtitle: z.string().max(480).default(''),
	ctaLabel: z.string().max(60).default(''),
	ctaHref: z.string().max(512).default(''),
	align: z.enum(['left', 'center']).default('center'),
	background: z.enum(['none', 'subtle', 'gradient']).default('subtle'),
});

export type HeroProps = z.infer<typeof HeroSchema>;

export const HERO_DEFAULTS: HeroProps = {
	eyebrow: '',
	title: 'Dein Titel',
	subtitle: 'Eine kurze Beschreibung — was macht diese Seite relevant?',
	ctaLabel: '',
	ctaHref: '',
	align: 'center',
	background: 'subtle',
};
