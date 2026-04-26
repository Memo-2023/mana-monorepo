/**
 * Comic module tools — AI-accessible operations over comic stories.
 *
 * Auto (read-only):
 *   - list_comic_stories
 *
 * Propose (human approval per the agent's policy — generate burns
 * credits so it's never auto):
 *   - create_comic_story
 *   - generate_comic_panel
 *
 * Character references (face-ref + optional body-ref) resolve
 * automatically from the active space's primary meImages — the AI
 * caller doesn't have to know about mediaIds. That's a deliberate
 * simplification versus the MCP layer (packages/mana-tool-registry/
 * src/modules/comic.ts) which accepts an explicit `characterMediaIds`
 * array; the webapp-runner pattern is "compose for the user, then
 * propose", and forcing the planner to list mediaIds before creating
 * a story was friction with no upside.
 *
 * Panel rendering delegates to the existing `runPanelGenerate` from
 * api/generate-panel.ts, which is the same code path the DetailView's
 * PanelEditor uses — so the encryption + picture.images insertion +
 * story appendPanel happen exactly once regardless of whether the
 * user or the agent triggered it.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords, VaultLockedError } from '$lib/data/crypto';
import { meImagesTable } from '$lib/modules/profile/collections';
import { comicStoriesStore } from './stores/stories.svelte';
import { comicCharactersStore } from './stores/characters.svelte';
import { runPanelGenerate, DEFAULT_PANEL_MODEL, type PanelModel } from './api/generate-panel';
import { runCharacterGenerate } from './api/generate-character';
import { comicCharactersTable } from './collections';
import { toStory, toCharacter } from './types';
import type { ComicStyle, LocalComicStory, LocalComicCharacter } from './types';

const VALID_MODELS: readonly PanelModel[] = [
	'openai/gpt-image-2',
	'google/gemini-3-pro-image-preview',
	'google/gemini-3.1-flash-image-preview',
] as const;

function isValidModel(v: unknown): v is PanelModel {
	return typeof v === 'string' && (VALID_MODELS as readonly string[]).includes(v);
}
import type { LocalMeImage } from '$lib/modules/profile/types';
import { getActiveSpace } from '$lib/data/scope';

const VALID_STYLES: ComicStyle[] = ['comic', 'manga', 'cartoon', 'graphic-novel', 'webtoon'];

function isValidStyle(v: unknown): v is ComicStyle {
	return typeof v === 'string' && (VALID_STYLES as string[]).includes(v);
}

/**
 * Resolve the active space's primary face-ref (+ optional body-ref) to
 * a mediaId array suitable for `characterMediaIds`. Non-reactive — we
 * scan meImagesTable directly instead of going through the svelte
 * `useImageByPrimary` hook because tools run outside the Svelte
 * reactivity graph.
 */
async function resolveCharacterMediaIds(): Promise<{
	mediaIds: string[];
	faceRef: string | null;
	bodyRef: string | null;
}> {
	const space = getActiveSpace();
	if (!space) return { mediaIds: [], faceRef: null, bodyRef: null };
	const all = await meImagesTable.toArray();
	const inSpace = all.filter((m) => !m.deletedAt && m.spaceId === space.id);
	const face = inSpace.find((m) => m.primaryFor === 'face-ref') ?? null;
	const body = inSpace.find((m) => m.primaryFor === 'body-ref') ?? null;
	const mediaIds: string[] = [];
	if (face?.mediaId) mediaIds.push(face.mediaId);
	if (body?.mediaId) mediaIds.push(body.mediaId);
	return { mediaIds, faceRef: face?.mediaId ?? null, bodyRef: body?.mediaId ?? null };
}

export const comicTools: ModuleTool[] = [
	{
		name: 'list_comic_stories',
		module: 'comic',
		description:
			'Listet Comic-Stories im aktiven Space (id, title, style, panelCount, isFavorite). Optional nach Stil oder Favoriten filterbar.',
		parameters: [
			{
				name: 'style',
				type: 'string',
				description: 'Nur einen Stil zeigen',
				required: false,
				enum: [...VALID_STYLES],
			},
			{
				name: 'favoriteOnly',
				type: 'boolean',
				description: 'Nur Favoriten',
				required: false,
			},
			{ name: 'limit', type: 'number', description: 'Max (Standard 30)', required: false },
		],
		async execute(params) {
			const styleFilter = params.style as ComicStyle | undefined;
			const favoriteOnly = params.favoriteOnly === true;
			const limit = Math.min(Math.max(Number(params.limit) || 30, 1), 100);

			try {
				const locals = await scopedForModule<LocalComicStory, string>(
					'comic',
					'comicStories'
				).toArray();
				const visible = locals.filter((s) => !s.deletedAt && !s.isArchived);
				const decrypted = await decryptRecords('comicStories', visible);
				const rows = decrypted
					.map(toStory)
					.filter((s) => (styleFilter ? s.style === styleFilter : true))
					.filter((s) => (favoriteOnly ? s.isFavorite === true : true))
					.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
					.slice(0, limit)
					.map((s) => ({
						id: s.id,
						title: s.title,
						style: s.style,
						panelCount: s.panelImageIds.length,
						isFavorite: s.isFavorite === true,
						description: s.description ?? null,
						storyContext: s.storyContext ?? null,
					}));

				return {
					success: true,
					data: { stories: rows, total: rows.length },
					message: `${rows.length} Stor${rows.length === 1 ? 'y' : 'ies'} gelistet`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return {
						success: false,
						message: 'Vault ist gesperrt — Comic-Stories können nicht entschlüsselt werden',
					};
				}
				throw err;
			}
		},
	},

	{
		name: 'create_comic_story',
		module: 'comic',
		description:
			'Legt eine neue Comic-Story an. Charakter-Referenzen werden automatisch aus den primary face-ref + body-ref des aktiven Space aufgeloest — Nutzer muss vorher ein Gesichtsbild in /profile/me-images hochgeladen haben. Stil ist fix, alle spaeteren Panels nutzen denselben Stil-Prefix.',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel der Story', required: true },
			{
				name: 'style',
				type: 'string',
				description: 'Visueller Stil',
				required: true,
				enum: [...VALID_STYLES],
			},
			{
				name: 'description',
				type: 'string',
				description: 'Kurze Story-Beschreibung',
				required: false,
			},
			{
				name: 'storyContext',
				type: 'string',
				description: 'Freitext-Briefing — Ton, Ziel, Hintergrund',
				required: false,
			},
			{
				name: 'tags',
				type: 'string',
				description: 'Tags durch Komma getrennt',
				required: false,
			},
		],
		async execute(params) {
			const title = String(params.title ?? '').trim();
			if (!title) return { success: false, message: 'title erforderlich' };

			const style = params.style;
			if (!isValidStyle(style)) {
				return {
					success: false,
					message: `style muss einer von ${VALID_STYLES.join(', ')} sein`,
				};
			}

			const refs = await resolveCharacterMediaIds();
			if (refs.mediaIds.length === 0) {
				return {
					success: false,
					message:
						'Kein Gesichtsbild im aktiven Space. Lade eines in /profile/me-images hoch, dann erneut versuchen.',
				};
			}

			const description =
				typeof params.description === 'string' && params.description.trim()
					? params.description.trim()
					: null;
			const storyContext =
				typeof params.storyContext === 'string' && params.storyContext.trim()
					? params.storyContext.trim()
					: null;
			const tags =
				typeof params.tags === 'string' && params.tags.trim()
					? params.tags
							.split(',')
							.map((t) => t.trim())
							.filter((t) => t.length > 0)
					: [];

			try {
				const story = await comicStoriesStore.createStory({
					title,
					style,
					characterMediaIds: refs.mediaIds,
					description,
					storyContext,
					tags,
				});
				return {
					success: true,
					data: {
						id: story.id,
						title: story.title,
						style: story.style,
						characterRefCount: refs.mediaIds.length,
						hasBodyRef: refs.bodyRef !== null,
					},
					message: `Story "${story.title}" angelegt (Stil: ${story.style})`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return { success: false, message: 'Vault ist gesperrt — Story nicht gespeichert' };
				}
				throw err;
			}
		},
	},

	{
		name: 'generate_comic_panel',
		module: 'comic',
		description:
			'Rendert ein neues Panel in einer bestehenden Story via gpt-image-2. Konsumiert Credits (low=3, medium=10, high=25). Stil-Prefix und Charakter-Refs kommen aus der Story — nur Panel-Prompt + optional Caption/Dialog werden uebergeben. Caption und Dialog werden direkt in das Bild gerendert.',
		parameters: [
			{ name: 'storyId', type: 'string', description: 'ID der Story', required: true },
			{
				name: 'panelPrompt',
				type: 'string',
				description:
					'Was passiert in diesem Panel (Szene, Aktion, Stimmung). Kurze englische Saetze am stabilsten.',
				required: true,
			},
			{
				name: 'caption',
				type: 'string',
				description: 'Erzaehl-Zeile ueber/unter dem Bild',
				required: false,
			},
			{
				name: 'dialogue',
				type: 'string',
				description: 'Sprechblasen-Text',
				required: false,
			},
			{
				name: 'quality',
				type: 'string',
				description: 'Render-Qualitaet — hoeher = mehr Credits',
				required: false,
				enum: ['low', 'medium', 'high'],
			},
			{
				name: 'model',
				type: 'string',
				description:
					'Rendering-Backend (Default openai/gpt-image-2). Alternativen: google/gemini-3-pro-image-preview (Nano Banana Pro), google/gemini-3.1-flash-image-preview (Nano Banana 2).',
				required: false,
				enum: [...VALID_MODELS],
			},
		],
		async execute(params) {
			const storyId = String(params.storyId ?? '').trim();
			if (!storyId) return { success: false, message: 'storyId erforderlich' };

			const panelPrompt = String(params.panelPrompt ?? '').trim();
			if (!panelPrompt) return { success: false, message: 'panelPrompt erforderlich' };

			const caption =
				typeof params.caption === 'string' && params.caption.trim()
					? params.caption.trim()
					: undefined;
			const dialogue =
				typeof params.dialogue === 'string' && params.dialogue.trim()
					? params.dialogue.trim()
					: undefined;
			const quality =
				params.quality === 'low' || params.quality === 'high' ? params.quality : 'medium';
			const model = isValidModel(params.model) ? params.model : DEFAULT_PANEL_MODEL;

			try {
				// Load the story for runPanelGenerate — same code path as the
				// PanelEditor in the web UI.
				const locals = await scopedForModule<LocalComicStory, string>('comic', 'comicStories')
					.and((s) => s.id === storyId)
					.toArray();
				const [local] = locals;
				if (!local || local.deletedAt) {
					return { success: false, message: `Story ${storyId} nicht gefunden` };
				}
				const [decrypted] = await decryptRecords('comicStories', [local]);
				if (!decrypted) {
					return { success: false, message: 'Entschlüsselung der Story fehlgeschlagen' };
				}
				const story = toStory(decrypted);

				const result = await runPanelGenerate({
					story,
					panelPrompt,
					caption,
					dialogue,
					quality: quality as 'low' | 'medium' | 'high',
					model,
				});

				return {
					success: true,
					data: {
						imageId: result.imageId,
						imageUrl: result.imageUrl,
						panelIndex: result.panelIndex,
						model: result.model,
					},
					message: `Panel ${result.panelIndex + 1} für Story "${story.title}" generiert`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return { success: false, message: 'Vault ist gesperrt — Panel nicht angehängt' };
				}
				return {
					success: false,
					message: err instanceof Error ? err.message : 'Panel-Generierung fehlgeschlagen',
				};
			}
		},
	},
];

// Imported for side-effect types — keeps unused-import warnings quiet
// when the LocalMeImage reference in resolveCharacterMediaIds is
// compile-time only.
export type { LocalMeImage };

// ─── Character tools (Mc4) ────────────────────────────────────────

export const comicCharacterTools: ModuleTool[] = [
	{
		name: 'list_comic_characters',
		module: 'comic',
		description:
			'Listet Comic-Characters im aktiven Space (id, name, style, variantCount, pinnedVariantId, isFavorite). Optional nach Stil oder Favoriten filterbar.',
		parameters: [
			{
				name: 'style',
				type: 'string',
				description: 'Nur einen Stil zeigen',
				required: false,
				enum: [...VALID_STYLES],
			},
			{
				name: 'favoriteOnly',
				type: 'boolean',
				description: 'Nur Favoriten',
				required: false,
			},
			{ name: 'limit', type: 'number', description: 'Max (Standard 30)', required: false },
		],
		async execute(params) {
			const styleFilter = params.style as ComicStyle | undefined;
			const favoriteOnly = params.favoriteOnly === true;
			const limit = Math.min(Math.max(Number(params.limit) || 30, 1), 100);

			try {
				const locals = await scopedForModule<LocalComicCharacter, string>(
					'comic',
					'comicCharacters'
				).toArray();
				const visible = locals.filter((c) => !c.deletedAt && !c.isArchived);
				const decrypted = await decryptRecords('comicCharacters', visible);
				const rows = decrypted
					.map(toCharacter)
					.filter((c) => (styleFilter ? c.style === styleFilter : true))
					.filter((c) => (favoriteOnly ? c.isFavorite === true : true))
					.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
					.slice(0, limit)
					.map((c) => ({
						id: c.id,
						name: c.name,
						style: c.style,
						variantCount: c.variantMediaIds.length,
						pinnedVariantId: c.pinnedVariantId ?? null,
						isFavorite: c.isFavorite === true,
					}));

				return {
					success: true,
					data: { characters: rows, total: rows.length },
					message: `${rows.length} Character${rows.length === 1 ? '' : 's'} gelistet`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return {
						success: false,
						message: 'Vault ist gesperrt — Comic-Characters können nicht entschlüsselt werden',
					};
				}
				throw err;
			}
		},
	},

	{
		name: 'create_comic_character',
		module: 'comic',
		description:
			'Legt einen neuen Comic-Character an OHNE direkt Varianten zu rendern. Charakter-Refs werden automatisch aus dem primary face-ref + body-ref des aktiven Space aufgeloest. Stil ist fix nach Anlage.',
		parameters: [
			{ name: 'name', type: 'string', description: 'Name des Characters', required: true },
			{
				name: 'style',
				type: 'string',
				description: 'Visueller Stil',
				required: true,
				enum: [...VALID_STYLES],
			},
			{
				name: 'addPrompt',
				type: 'string',
				description: 'Zusaetzlicher Prompt',
				required: false,
			},
			{
				name: 'description',
				type: 'string',
				description: 'Kurze Charakter-Beschreibung',
				required: false,
			},
			{ name: 'tags', type: 'string', description: 'Tags durch Komma getrennt', required: false },
		],
		async execute(params) {
			const name = String(params.name ?? '').trim();
			if (!name) return { success: false, message: 'name erforderlich' };

			const style = params.style;
			if (!isValidStyle(style)) {
				return {
					success: false,
					message: `style muss einer von ${VALID_STYLES.join(', ')} sein`,
				};
			}

			const refs = await resolveCharacterMediaIds();
			if (!refs.faceRef) {
				return {
					success: false,
					message:
						'Kein Gesichtsbild im aktiven Space. Lade eines in /profile/me-images hoch, dann erneut versuchen.',
				};
			}

			const description =
				typeof params.description === 'string' && params.description.trim()
					? params.description.trim()
					: null;
			const addPrompt =
				typeof params.addPrompt === 'string' && params.addPrompt.trim()
					? params.addPrompt.trim()
					: null;
			const tags =
				typeof params.tags === 'string' && params.tags.trim()
					? params.tags
							.split(',')
							.map((t) => t.trim())
							.filter((t) => t.length > 0)
					: [];

			try {
				const character = await comicCharactersStore.createCharacter({
					name,
					style,
					sourceFaceMediaId: refs.faceRef,
					sourceBodyMediaId: refs.bodyRef,
					addPrompt,
					description,
					tags,
				});
				return {
					success: true,
					data: {
						id: character.id,
						name: character.name,
						style: character.style,
						hasBodyRef: refs.bodyRef !== null,
						note: 'Character-Row angelegt — jetzt generate_character_variant aufrufen um Varianten zu rendern.',
					},
					message: `Character "${character.name}" angelegt (Stil: ${character.style})`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return { success: false, message: 'Vault ist gesperrt — Character nicht gespeichert' };
				}
				throw err;
			}
		},
	},

	{
		name: 'generate_character_variant',
		module: 'comic',
		description:
			'Rendert N (default 4) Variant-Portraits fuer einen existierenden Comic-Character via gpt-image-2. Konsumiert Credits × count. Auto-pinnt die erste Variante wenn noch keine gepinnt ist.',
		parameters: [
			{ name: 'characterId', type: 'string', description: 'ID des Characters', required: true },
			{
				name: 'count',
				type: 'number',
				description: 'Anzahl Varianten (1-4, default 4)',
				required: false,
			},
			{
				name: 'quality',
				type: 'string',
				description: 'Render-Qualitaet',
				required: false,
				enum: ['low', 'medium', 'high'],
			},
			{
				name: 'model',
				type: 'string',
				description: 'Rendering-Backend',
				required: false,
				enum: [...VALID_MODELS],
			},
		],
		async execute(params) {
			const characterId = String(params.characterId ?? '').trim();
			if (!characterId) return { success: false, message: 'characterId erforderlich' };

			const count = Math.max(1, Math.min(4, Number(params.count) || 4));
			const quality =
				params.quality === 'low' || params.quality === 'high' ? params.quality : 'medium';
			const model: PanelModel = isValidModel(params.model) ? params.model : DEFAULT_PANEL_MODEL;

			try {
				const local = await comicCharactersTable.get(characterId);
				if (!local || local.deletedAt) {
					return { success: false, message: `Character ${characterId} nicht gefunden` };
				}
				const [decrypted] = await decryptRecords('comicCharacters', [local]);
				if (!decrypted) {
					return { success: false, message: 'Entschlüsselung des Characters fehlgeschlagen' };
				}
				const character = toCharacter(decrypted);

				const result = await runCharacterGenerate({
					character,
					count,
					quality: quality as 'low' | 'medium' | 'high',
					model,
				});

				return {
					success: true,
					data: {
						characterId: character.id,
						newVariantMediaIds: result.variantMediaIds,
						imageUrls: result.imageUrls,
						model: result.model,
					},
					message: `${result.variantMediaIds.length} Variant${result.variantMediaIds.length === 1 ? '' : 's'} für "${character.name}" generiert`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return { success: false, message: 'Vault ist gesperrt' };
				}
				return {
					success: false,
					message: err instanceof Error ? err.message : 'Variant-Generierung fehlgeschlagen',
				};
			}
		},
	},

	{
		name: 'pin_character_variant',
		module: 'comic',
		description:
			'Setzt einen anderen Variant als kanonischen Look. Stories danach erstellt nutzen den neuen Pin — bestehende Stories bleiben unveraendert (Snapshot-Pattern).',
		parameters: [
			{ name: 'characterId', type: 'string', description: 'ID des Characters', required: true },
			{
				name: 'variantMediaId',
				type: 'string',
				description: 'ID des neuen Pin-Variants',
				required: true,
			},
		],
		async execute(params) {
			const characterId = String(params.characterId ?? '').trim();
			const variantMediaId = String(params.variantMediaId ?? '').trim();
			if (!characterId || !variantMediaId) {
				return { success: false, message: 'characterId und variantMediaId erforderlich' };
			}

			try {
				await comicCharactersStore.pinVariant(characterId, variantMediaId);
				return {
					success: true,
					data: { characterId, pinnedVariantId: variantMediaId },
					message: `Variant gepinned`,
				};
			} catch (err) {
				return {
					success: false,
					message: err instanceof Error ? err.message : 'Pin fehlgeschlagen',
				};
			}
		},
	},
];

// Append character tools to the main export so init.ts picks them
// up via the existing registerTools(comicTools) call.
comicTools.push(...comicCharacterTools);
