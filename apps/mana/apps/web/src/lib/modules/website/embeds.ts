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
import { timeBlockTable } from '$lib/data/time-blocks/collections';
import { mediaFileUrl } from './upload';
import type { EmbedItem, EmbedSource, ModuleEmbedProps } from '@mana/website-blocks';
import type { LocalBoard, LocalBoardItem, LocalImage } from '$lib/modules/picture/types';
import type { LocalLibraryEntry } from '$lib/modules/library/types';
import type { LocalEvent } from '$lib/modules/calendar/types';
import type { LocalTask } from '$lib/modules/todo/types';
import type { LocalTaskTag } from '$lib/modules/todo/types';
import type { LocalGoal } from '$lib/companion/goals/types';
import type { LocalPlace } from '$lib/modules/places/types';
import type { LocalRecipe } from '$lib/modules/recipes/types';
import type { LocalWardrobeOutfit } from '$lib/modules/wardrobe/types';
import type { LocalComicStory } from '$lib/modules/comic/types';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

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
			case 'calendar.events':
				items = await resolveCalendarEvents(props);
				break;
			case 'todo.tasks':
				items = await resolveTodoTasks(props);
				break;
			case 'goals.goals':
				items = await resolveGoals(props);
				break;
			case 'places.places':
				items = await resolvePlaces(props);
				break;
			case 'recipes.recipes':
				items = await resolveRecipes(props);
				break;
			case 'wardrobe.outfits':
				items = await resolveWardrobeOutfits(props);
				break;
			case 'comic.stories':
				items = await resolveComicStories(props);
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
 * Picture-board: returns image items for a board whose owner flipped
 * its visibility to 'public' via the VisibilityPicker. `canEmbedOnWebsite`
 * is the hard gate; the soft-migration fallback maps legacy `isPublic`
 * rows (pre-M3) to the right level.
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
	const boardVisibility =
		rawBoard.visibility ?? (rawBoard.isPublic === true ? 'public' : 'private');
	if (!canEmbedOnWebsite(boardVisibility)) {
		throw new Error('Board ist nicht öffentlich — setze es im Picture-Modul auf "Öffentlich"');
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

/**
 * Calendar-events: returns events whose owner flipped visibility to
 * 'public'. By design (plan §2), the snapshot carries a whitelist of
 * fields only — title, start/end time, location. Description, guest
 * list, reminders, and tags are NOT inlined because they frequently
 * carry private context that an event's visibility toggle shouldn't
 * accidentally expose.
 *
 * Optional filters on top of the hard gate:
 *   - upcomingDays: number of days forward from now; events starting
 *     later are dropped. Omit to include all (past + future).
 *   - tagIds: at-least-one overlap with event.tagIds.
 */
async function resolveCalendarEvents(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	let events = await db.table<LocalEvent>('events').toArray();
	events = events.filter((e) => !e.deletedAt && canEmbedOnWebsite(e.visibility ?? 'private'));

	if (props.filter?.tagIds?.length) {
		const wanted = new Set(props.filter.tagIds);
		events = events.filter((e) => (e.tagIds ?? []).some((t) => wanted.has(t)));
	}

	const decrypted = (await decryptRecords('events', events)) as LocalEvent[];

	// Join with TimeBlock for the actual start/end times (events only
	// store a reference). Fetch in one pass, then attach by id.
	const blockIds = decrypted.map((e) => e.timeBlockId).filter((id): id is string => Boolean(id));
	const blocks = await timeBlockTable.where('id').anyOf(blockIds).toArray();
	const byBlockId = new Map<string, LocalTimeBlock>();
	for (const b of blocks) byBlockId.set(b.id, b);

	const now = Date.now();
	const upcomingCutoff =
		typeof props.filter?.upcomingDays === 'number'
			? now + props.filter.upcomingDays * 24 * 60 * 60 * 1000
			: null;

	const withBlock: Array<{ event: LocalEvent; block: LocalTimeBlock; startMs: number }> = [];
	for (const e of decrypted) {
		const b = byBlockId.get(e.timeBlockId);
		if (!b) continue;
		const startMs = Date.parse(b.startDate);
		if (Number.isNaN(startMs)) continue;
		if (upcomingCutoff !== null && (startMs < now || startMs > upcomingCutoff)) continue;
		withBlock.push({ event: e, block: b, startMs });
	}

	// Upcoming-first; same-day ties broken by id so the snapshot is stable.
	withBlock.sort((a, b) => a.startMs - b.startMs || a.event.id.localeCompare(b.event.id));

	return withBlock.map(({ event, block }) => ({
		title: event.title,
		subtitle: formatEventSubtitle(block.startDate, block.endDate, block.allDay, event.location),
	}));
}

/**
 * Build the subtitle shown under a calendar-event embed card. Kept in
 * the plaintext layer (not in the Svelte renderer) so the inlined blob
 * is self-contained and the public page needs no locale-aware
 * formatting round-trip. German only for now — matches the rest of the
 * module copy.
 */
function formatEventSubtitle(
	startIso: string,
	endIso: string | null,
	allDay: boolean,
	location: string | null | undefined
): string {
	const start = new Date(startIso);
	const dateParts = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(start);

	let timePart = '';
	if (!allDay) {
		const timeFormat = new Intl.DateTimeFormat('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});
		const startTime = timeFormat.format(start);
		if (endIso) {
			const endTime = timeFormat.format(new Date(endIso));
			timePart = ` · ${startTime}–${endTime}`;
		} else {
			timePart = ` · ${startTime}`;
		}
	}

	const loc = location?.trim();
	const locPart = loc ? ` · ${loc}` : '';
	return `${dateParts}${timePart}${locPart}`;
}

/**
 * Todo-tasks: public-roadmap use case. Returns tasks flipped to
 * 'public' via the VisibilityPicker on the Todo DetailView. Filters
 * (status, tagIds) are optional and stack on top of the hard gate.
 *
 * Whitelist (plan §2): only title and a compact status label land in
 * the snapshot. Description, subtasks, LLM-labels, dueDate, and
 * project-membership stay out — they frequently carry private context
 * the user didn't intend to publish by flipping a single flag.
 *
 * `tagIds` filter: tasks are tagged through the N:N `taskTags` table;
 * the resolver joins tag assignments inline rather than asking each
 * task to carry a denormalised tagIds array.
 */
async function resolveTodoTasks(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	let tasks = await db.table<LocalTask>('tasks').toArray();
	tasks = tasks.filter((t) => !t.deletedAt && canEmbedOnWebsite(t.visibility ?? 'private'));

	if (props.filter?.status) {
		const wantCompleted = props.filter.status === 'completed';
		tasks = tasks.filter((t) => t.isCompleted === wantCompleted);
	}

	if (props.filter?.tagIds?.length) {
		const wanted = new Set(props.filter.tagIds);
		const taskTags = await db.table<LocalTaskTag>('taskTags').toArray();
		const hitTaskIds = new Set(
			taskTags.filter((tt) => wanted.has(tt.tagId)).map((tt) => tt.taskId)
		);
		tasks = tasks.filter((t) => hitTaskIds.has(t.id));
	}

	const decrypted = (await decryptRecords('tasks', tasks)) as LocalTask[];

	// Newest public-items first (by updatedAt); id as stable tiebreaker.
	decrypted.sort(
		(a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.id.localeCompare(b.id)
	);

	return decrypted.map((t) => ({
		title: t.title,
		subtitle: t.isCompleted ? 'Erledigt' : 'In Arbeit',
	}));
}

/**
 * Goals: the "public progress page" use case — marked-public goals with
 * their current-period progress inlined so a visitor can see "4/5
 * Workouts diese Woche" at a glance. Gates hard on canEmbedOnWebsite.
 *
 * The inlined snapshot carries only title + formatted progress
 * ("currentValue / target period"). Description is dropped — users
 * often keep it as an internal "why this matters" note. Metric
 * configuration (which event type, filter fields) also stays private —
 * it leaks implementation detail of what the user tracks.
 */
async function resolveGoals(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	let goals = await db.table<LocalGoal>('companionGoals').toArray();
	goals = goals.filter((g) => !g.deletedAt && canEmbedOnWebsite(g.visibility ?? 'private'));

	if (props.filter?.status) {
		goals = goals.filter((g) => g.status === props.filter?.status);
	}

	// Active goals first, then by target value descending so the
	// chunkier milestones land at the top.
	goals.sort((a, b) => {
		if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
		return b.target.value - a.target.value || a.id.localeCompare(b.id);
	});

	return goals.map((g) => ({
		title: g.title,
		subtitle: formatGoalProgress(g),
	}));
}

function formatGoalProgress(g: LocalGoal): string {
	const periodLabel =
		g.target.period === 'day' ? 'Tag' : g.target.period === 'week' ? 'Woche' : 'Monat';
	return `${g.currentValue} / ${g.target.value} · ${periodLabel}`;
}

/**
 * Places: "my favourite cafes" / "rehearsal rooms" / "gyms I train at".
 * Hard-gated on canEmbedOnWebsite.
 *
 * Whitelist (plan §2): title (place name) + subtitle (address only).
 * Latitude/longitude are NOT inlined — 10m precision of a home or
 * workplace can identify someone, and publishing coords by default on
 * a visibility flip would be the classic leak the design explicitly
 * guards against.
 */
async function resolvePlaces(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	let places = await db.table<LocalPlace>('places').toArray();
	places = places.filter(
		(p) => !p.deletedAt && !p.isArchived && canEmbedOnWebsite(p.visibility ?? 'private')
	);

	if (props.filter?.kind) {
		places = places.filter((p) => p.category === props.filter?.kind);
	}
	if (props.filter?.isFavorite === true) {
		places = places.filter((p) => p.isFavorite === true);
	}
	if (props.filter?.tagIds?.length) {
		const wanted = new Set(props.filter.tagIds);
		places = places.filter((p) => (p.tagIds ?? []).some((t) => wanted.has(t)));
	}

	const decrypted = (await decryptRecords('places', places)) as LocalPlace[];

	// Favourites first, then alphabetical for a stable order.
	decrypted.sort((a, b) => {
		const favA = a.isFavorite ? 0 : 1;
		const favB = b.isFavorite ? 0 : 1;
		if (favA !== favB) return favA - favB;
		return a.name.localeCompare(b.name);
	});

	return decrypted.map((p) => ({
		title: p.name,
		subtitle: p.address ?? undefined,
	}));
}

/**
 * Recipes: "my tested recipes" / "cookbook". Hard-gated on
 * canEmbedOnWebsite.
 *
 * Whitelist (plan §2): title + description + photo URL + compact
 * time/difficulty line. Ingredient list, cooking steps, and internal
 * tags stay out of the snapshot — the public embed is a teaser, not
 * the full recipe. A future extension could surface the full recipe
 * on a dedicated /s/<slug>/recipes/<id> page behind an unlisted token,
 * but that's M8 scope.
 */
async function resolveRecipes(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	let recipes = await db.table<LocalRecipe>('recipes').toArray();
	recipes = recipes.filter((r) => !r.deletedAt && canEmbedOnWebsite(r.visibility ?? 'private'));

	if (props.filter?.isFavorite === true) {
		recipes = recipes.filter((r) => r.isFavorite === true);
	}
	if (props.filter?.tagIds?.length) {
		const wanted = new Set(props.filter.tagIds);
		recipes = recipes.filter((r) => (r.tags ?? []).some((t) => wanted.has(t)));
	}

	const decrypted = (await decryptRecords('recipes', recipes)) as LocalRecipe[];

	// Favourites first, then newest.
	decrypted.sort((a, b) => {
		const favA = a.isFavorite ? 0 : 1;
		const favB = b.isFavorite ? 0 : 1;
		if (favA !== favB) return favA - favB;
		return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
	});

	return decrypted.map((r) => {
		const total = (r.prepTimeMin ?? 0) + (r.cookTimeMin ?? 0) || null;
		const timeLabel =
			total !== null && total > 0
				? total < 60
					? `${total} Min`
					: `${Math.floor(total / 60)}h ${total % 60}m`
				: null;
		const parts = [timeLabel, `${r.servings} Port.`].filter((x): x is string => Boolean(x));
		return {
			title: r.title,
			subtitle: parts.join(' · ') || undefined,
			imageUrl: r.photoThumbnailUrl ?? r.photoUrl ?? undefined,
		};
	});
}

/**
 * Wardrobe-outfits: style-portfolio use case. Returns outfits flipped
 * to 'public' with their most recent try-on preview as the card image.
 * Hard-gated on canEmbedOnWebsite.
 *
 * Whitelist: name + occasion/season line + the `lastTryOn.imageUrl`
 * (which is just a mana-media URL pointing at an AI-generated wearing
 * shot — no facial identifier unless the user chose to share one).
 * Individual garments, tags, and description stay out of the snapshot.
 */
async function resolveWardrobeOutfits(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	let outfits = await db.table<LocalWardrobeOutfit>('wardrobeOutfits').toArray();
	outfits = outfits.filter(
		(o) => !o.deletedAt && !o.isArchived && canEmbedOnWebsite(o.visibility ?? 'private')
	);

	if (props.filter?.isFavorite === true) {
		outfits = outfits.filter((o) => o.isFavorite === true);
	}
	if (props.filter?.tagIds?.length) {
		const wanted = new Set(props.filter.tagIds);
		outfits = outfits.filter((o) => (o.tags ?? []).some((t) => wanted.has(t)));
	}

	const decrypted = (await decryptRecords('wardrobeOutfits', outfits)) as LocalWardrobeOutfit[];

	// Favourites first, then newest.
	decrypted.sort((a, b) => {
		const favA = a.isFavorite ? 0 : 1;
		const favB = b.isFavorite ? 0 : 1;
		if (favA !== favB) return favA - favB;
		return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
	});

	return decrypted.map((o) => {
		const meta: string[] = [];
		if (o.occasion) meta.push(o.occasion);
		if (o.season?.length) meta.push(o.season.join(', '));
		return {
			title: o.name,
			subtitle: meta.length > 0 ? meta.join(' · ') : undefined,
			imageUrl: o.lastTryOn?.imageUrl ?? undefined,
		};
	});
}

/**
 * Comic-stories: public-comic-portfolio use case. Returns stories
 * flipped to 'public' with their cover panel as the card image
 * (panelImageIds[0] → picture.images.publicUrl). Hard-gated on
 * canEmbedOnWebsite.
 *
 * Whitelist (plan §2): title + "N Panels" subtitle + cover-panel URL.
 * Character references, panel captions/dialogues, storyContext, and
 * the full panelMeta stay out of the snapshot — the cover image is
 * already an AI-rendered artifact, the other fields would leak the
 * author's briefing and source-entry linkage.
 */
async function resolveComicStories(props: ModuleEmbedProps): Promise<EmbedItem[]> {
	let stories = await db.table<LocalComicStory>('comicStories').toArray();
	stories = stories.filter(
		(s) => !s.deletedAt && !s.isArchived && canEmbedOnWebsite(s.visibility ?? 'private')
	);

	if (props.filter?.isFavorite === true) {
		stories = stories.filter((s) => s.isFavorite === true);
	}
	if (props.filter?.kind) {
		// `kind` reuses the generic filter slot as a style filter so the
		// website editor can restrict to e.g. only manga-style comics.
		stories = stories.filter((s) => s.style === props.filter?.kind);
	}
	if (props.filter?.tagIds?.length) {
		const wanted = new Set(props.filter.tagIds);
		stories = stories.filter((s) => (s.tags ?? []).some((t) => wanted.has(t)));
	}

	const decrypted = (await decryptRecords('comicStories', stories)) as LocalComicStory[];

	// Favourites first, then newest.
	decrypted.sort((a, b) => {
		const favA = a.isFavorite ? 0 : 1;
		const favB = b.isFavorite ? 0 : 1;
		if (favA !== favB) return favA - favB;
		return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
	});

	const coverImageIds = decrypted
		.map((s) => s.panelImageIds?.[0])
		.filter((id): id is string => Boolean(id));
	const coverImages = await db
		.table<LocalImage>('images')
		.where('id')
		.anyOf(coverImageIds)
		.toArray();
	const coverById = new Map<string, LocalImage>();
	for (const img of coverImages) coverById.set(img.id, img);

	return decrypted.map((s) => {
		const coverId = s.panelImageIds?.[0];
		const cover = coverId ? coverById.get(coverId) : undefined;
		const panelCount = s.panelImageIds?.length ?? 0;
		return {
			title: s.title,
			subtitle: `${panelCount} ${panelCount === 1 ? 'Panel' : 'Panels'}`,
			imageUrl: cover?.publicUrl ?? undefined,
		};
	});
}
