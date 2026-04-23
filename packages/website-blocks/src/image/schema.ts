import { z } from 'zod';

export const ImageSchema = z.object({
	url: z.string().max(1024).default(''),
	altText: z.string().max(280).default(''),
	caption: z.string().max(280).default(''),
	/** 16:9 / 4:3 / 1:1 / auto — 'auto' uses the image's natural ratio. */
	aspectRatio: z.enum(['auto', '16:9', '4:3', '1:1', '21:9']).default('auto'),
	/** Max width constraint. 'container' = 48rem, 'full' = full bleed. */
	width: z.enum(['narrow', 'container', 'full']).default('container'),
	/** How to crop when aspect is fixed. */
	fit: z.enum(['cover', 'contain']).default('cover'),
});

export type ImageProps = z.infer<typeof ImageSchema>;

export const IMAGE_DEFAULTS: ImageProps = {
	url: '',
	altText: '',
	caption: '',
	aspectRatio: 'auto',
	width: 'container',
	fit: 'cover',
};
