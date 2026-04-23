import type { BlockSpec } from '../types';
import Image from './Image.svelte';
import { ImageSchema, IMAGE_DEFAULTS, type ImageProps } from './schema';

/**
 * Image block. The inspector is provided by the consuming app (the
 * editor), not by this package — uploads depend on mana-media which
 * lives outside @mana/website-blocks. The registry gets a
 * placeholder inspector that just edits URL + alt text; the real
 * upload-enabled inspector is injected via `overrideInspector()`
 * once the editor boots.
 */
import ImageInspectorFallback from './ImageInspectorFallback.svelte';

export const imageBlockSpec: BlockSpec<ImageProps> = {
	type: 'image',
	label: 'Bild',
	icon: 'image',
	category: 'media',
	schema: ImageSchema,
	schemaVersion: 1,
	defaults: IMAGE_DEFAULTS,
	Component: Image,
	Inspector: ImageInspectorFallback,
};

export type { ImageProps };
export { ImageSchema, IMAGE_DEFAULTS };
