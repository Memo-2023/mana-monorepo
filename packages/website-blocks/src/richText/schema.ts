import { z } from 'zod';

export const RichTextSchema = z.object({
	content: z.string().max(10_000).default(''),
	align: z.enum(['left', 'center']).default('left'),
	size: z.enum(['sm', 'md', 'lg']).default('md'),
});

export type RichTextProps = z.infer<typeof RichTextSchema>;

export const RICH_TEXT_DEFAULTS: RichTextProps = {
	content: '',
	align: 'left',
	size: 'md',
};
