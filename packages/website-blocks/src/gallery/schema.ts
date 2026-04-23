import { z } from 'zod';

export const GalleryImageSchema = z.object({
	url: z.string().min(1).max(1024),
	altText: z.string().max(280).default(''),
	caption: z.string().max(280).default(''),
});

export type GalleryImage = z.infer<typeof GalleryImageSchema>;

export const GallerySchema = z.object({
	title: z.string().max(160).default(''),
	images: z.array(GalleryImageSchema).max(60).default([]),
	layout: z.enum(['masonry', 'grid']).default('grid'),
	columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
	gap: z.enum(['sm', 'md', 'lg']).default('md'),
	lightbox: z.boolean().default(true),
});

export type GalleryProps = z.infer<typeof GallerySchema>;

export const GALLERY_DEFAULTS: GalleryProps = {
	title: '',
	images: [],
	layout: 'grid',
	columns: 3,
	gap: 'md',
	lightbox: true,
};
