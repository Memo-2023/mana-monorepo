import { z } from 'zod';

/**
 * Resolved item shape — every embed provider returns items in this
 * normalized form so the renderer doesn't care about the source.
 */
export const EmbedItemSchema = z.object({
	title: z.string(),
	subtitle: z.string().optional(),
	imageUrl: z.string().optional(),
	/** External link — for library entries, a page URL. */
	href: z.string().optional(),
});

export type EmbedItem = z.infer<typeof EmbedItemSchema>;

export const EmbedResolvedSchema = z.object({
	items: z.array(EmbedItemSchema),
	/** If resolution failed, the error message surfaces in public mode. */
	error: z.string().optional(),
	/** ISO timestamp of when resolution happened. */
	resolvedAt: z.string().optional(),
});

/**
 * Supported embed sources. Add new sources here + a matching provider
 * in the editor's publish resolver.
 */
export const EmbedSourceSchema = z.enum(['picture.board', 'library.entries']);
export type EmbedSource = z.infer<typeof EmbedSourceSchema>;

export const ModuleEmbedSchema = z.object({
	source: EmbedSourceSchema.default('picture.board'),
	/** Target id — board id for picture, empty for "all entries" in library. */
	sourceId: z.string().max(64).default(''),
	/** Display title. Optional; renderer falls back to source default. */
	title: z.string().max(160).default(''),
	layout: z.enum(['grid', 'list']).default('grid'),
	maxItems: z.number().int().min(1).max(48).default(12),
	/**
	 * Optional filters depending on source. Library uses { isFavorite?,
	 * status?, kind? }; picture ignores them in M4.
	 */
	filter: z
		.object({
			isFavorite: z.boolean().optional(),
			status: z.string().max(32).optional(),
			kind: z.string().max(32).optional(),
		})
		.default({}),
	/**
	 * Filled at publish time. The public renderer reads this directly —
	 * no Dexie, no API round-trip. The editor shows a "nicht aufgelöst"
	 * placeholder when missing.
	 */
	resolved: EmbedResolvedSchema.optional(),
});

export type ModuleEmbedProps = z.infer<typeof ModuleEmbedSchema>;

export const MODULE_EMBED_DEFAULTS: ModuleEmbedProps = {
	source: 'picture.board',
	sourceId: '',
	title: '',
	layout: 'grid',
	maxItems: 12,
	filter: {},
};
