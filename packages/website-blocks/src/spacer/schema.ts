import { z } from 'zod';

export const SpacerSchema = z.object({
	size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
});

export type SpacerProps = z.infer<typeof SpacerSchema>;

export const SPACER_DEFAULTS: SpacerProps = {
	size: 'md',
};
