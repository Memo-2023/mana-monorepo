/**
 * Module-embed resolvers — client-side functions that walk Dexie to
 * pre-fetch data for `moduleEmbed` blocks at publish time.
 *
 * These run exactly once per publish and inline the result into the
 * snapshot's `block.props.resolved` field, so the public renderer
 * reads the blob and never needs Dexie or the network to show embedded
 * content. Trade-off: publishes are slightly slower, public visits are
 * much faster.
 *
 * Every resolver MUST enforce the source's public-visibility rules —
 * e.g. `picture.board.isPublic === true`. An owner who embeds a
 * private board gets an empty result with a clear error message in the
 * resolved.error field.
 */

import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { canEmbedOnWebsite } from '@mana/shared-privacy';
import { mediaFileUrl } from './upload';
import type { EmbedItem, EmbedSource, ModuleEmbedProps } from '@mana/website-blocks';
import type { LocalBoard, LocalBoardItem, LocalImage } from '$lib/modules/picture/types';
import type { LocalLibraryEntry } from '$lib/modules/library/types';

export interface ResolvedEmbed {
	items: EmbedItem[];
	error?: string;
	resolvedAt: string;
}

/** Resolve a single moduleEmbed block's props. */
export async function resolveEmbed(props: ModuleEmbedProps): Promise<ResolvedEmbed> {
	const now = new Date().toISOString();
	try {
		let items: EmbedItem[];
		switch (props.source as EmbedSource) {
			case 'picture.board':
				items = await resolvePictureBoard(props);
				break;
			case 'library.entries':
				items = await resolveLibraryEntries(props);
				break;
			default:
				return {
					items: [],
					error: `Unbekannte Quelle: ${props.source}`,
					resolvedAt: now,
				};
		}
		return { items: items.slice(0, props.maxItems), resolvedAt: now };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { items: [], error: message, resolvedAt: now };
	}
}

/**
 * Picture-board: returns image items for a board that the owner marked
 * `isPublic=true`. Private boards return an error.
 */
async function resolvePictureBoard(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	if (!props.sourceId) {
		throw new Error('Bitte wähle ein Board aus');
	}

	const [rawBoard] = await db
		.table<LocalBoard>('boards')
		.where('id')
		.equals(props.sourceId)
		.toArray();

	if (!rawBoard || rawBoard.deletedAt) {
		throw new Error('Board nicht gefunden');
	}
	if (!rawBoard.isPublic) {
		throw new Error('Board ist nicht öffentlich — setze "Öffentlich" im Picture-Modul');
	}

	const items = await db
		.table<LocalBoardItem>('boardItems')
		.where('boardId')
		.equals(props.sourceId)
		.toArray();

	const imageItems = items
		.filter((i) => !i.deletedAt && i.itemType === 'image' && i.imageId)
		.sort((a, b) => a.zIndex - b.zIndex);

	if (imageItems.length === 0) return [];

	const imageIds = imageItems.map((i) => i.imageId as string);
	const images = await db.table<LocalImage>('images').where('id').anyOf(imageIds).toArray();
	const decrypted = (await decryptRecords('images', images)) as LocalImage[];
	const imageById = new Map<string, LocalImage>();
	for (const img of decrypted) imageById.set(img.id, img);

	const out: EmbedItem[] = [];
	for (const item of imageItems) {
		const img = imageById.get(item.imageId as string);
		if (!img) continue;
		const url = img.publicUrl ?? mediaFileUrl(img.id, 'medium');
		out.push({
			title: img.prompt?.slice(0, 120) || 'Bild',
			imageUrl: url,
		});
	}
	return out;
}

/**
 * Library-entries: returns book/movie/series/comic entries the owner has
 * explicitly marked 'public' via the VisibilityPicker on the entry's
 * detail view. `canEmbedOnWebsite` is the hard gate — user-provided
 * filters (kind/status/favorite) stack on top but cannot override it.
 *
 * First pilot of the unified visibility system (docs/plans/
 * visibility-system.md). Before M2 this path used `isFavorite` as a
 * weak proxy for public intent; that filter is still available as an
 * optional user-facing filter on top of the visibility gate.
 */
async function resolveLibraryEntries(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	let locals = await db.table<LocalLibraryEntry>('libraryEntries').toArray();
	locals = locals.filter((e) => !e.deletedAt && canEmbedOnWebsite(e.visibility ?? 'private'));

	if (props.filter?.kind) {
		locals = locals.filter((e) => e.kind === props.filter?.kind);
	}
	if (props.filter?.status) {
		locals = locals.filter((e) => e.status === props.filter?.status);
	}
	if (props.filter?.isFavorite === true) {
		locals = locals.filter((e) => e.isFavorite === true);
	}

	// Newest completions first.
	locals.sort((a, b) => {
		const aKey = a.completedAt ?? a.updatedAt ?? '';
		const bKey = b.completedAt ?? b.updatedAt ?? '';
		return bKey.localeCompare(aKey);
	});

	const decrypted = (await decryptRecords('libraryEntries', locals)) as LocalLibraryEntry[];

	return decrypted.map((entry) => {
		const creators = (entry.creators ?? []).slice(0, 2).join(', ');
		const year = entry.year ? ` · ${entry.year}` : '';
		const subtitle = creators ? `${creators}${year}` : year.trim() || undefined;
		return {
			title: entry.title,
			subtitle,
			imageUrl:
				entry.coverUrl ??
				(entry.coverMediaId ? mediaFileUrl(entry.coverMediaId, 'medium') : undefined),
		};
	});
}
