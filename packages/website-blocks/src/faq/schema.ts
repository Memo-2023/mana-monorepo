import { z } from 'zod';

export const FaqItemSchema = z.object({
	question: z.string().min(1).max(280),
	answer: z.string().min(1).max(2000),
});

export type FaqItem = z.infer<typeof FaqItemSchema>;

export const FaqSchema = z.object({
	title: z.string().max(160).default('FAQ'),
	items: z.array(FaqItemSchema).max(50).default([]),
	defaultOpen: z.boolean().default(false),
});

export type FaqProps = z.infer<typeof FaqSchema>;

export const FAQ_DEFAULTS: FaqProps = {
	title: 'Häufige Fragen',
	items: [
		{ question: 'Beispielfrage?', answer: 'Die Antwort. Klick in den Inspector zum Bearbeiten.' },
	],
	defaultOpen: false,
};
