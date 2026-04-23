import type { BlockSpec } from '../types';
import Gallery from './Gallery.svelte';
import GalleryInspectorFallback from './GalleryInspectorFallback.svelte';
import { GallerySchema, GALLERY_DEFAULTS, type GalleryProps, type GalleryImage } from './schema';

export const galleryBlockSpec: BlockSpec<GalleryProps> = {
	type: 'gallery',
	label: 'Galerie',
	icon: 'images',
	category: 'media',
	schema: GallerySchema,
	schemaVersion: 1,
	defaults: GALLERY_DEFAULTS,
	Component: Gallery,
	Inspector: GalleryInspectorFallback,
};

export type { GalleryProps, GalleryImage };
export { GallerySchema, GALLERY_DEFAULTS };
