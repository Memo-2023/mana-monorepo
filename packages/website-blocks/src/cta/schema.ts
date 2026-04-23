import { z } from 'zod';

export const CtaSchema = z.object({
	title: z.string().max(160).default(''),
	description: z.string().max(480).default(''),
	buttonLabel: z.string().min(1).max(60).default('Los geht’s'),
	buttonHref: z.string().max(512).default('#'),
	variant: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
	align: z.enum(['left', 'center']).default('center'),
	background: z.enum(['none', 'subtle', 'primary']).default('subtle'),
});

export type CtaProps = z.infer<typeof CtaSchema>;

export const CTA_DEFAULTS: CtaProps = {
	title: 'Bereit loszulegen?',
	description: '',
	buttonLabel: 'Jetzt starten',
	buttonHref: '#',
	variant: 'primary',
	align: 'center',
	background: 'subtle',
};
