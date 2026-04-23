/**
 * Wardrobe — tools for agents to browse a user's digital closet,
 * compose outfits, and run try-on generations. Four tools:
 *
 *   - wardrobe.listGarments    (read)   — what do I own, filtered by
 *                                         category / tags
 *   - wardrobe.listOutfits     (read)   — which combinations exist,
 *                                         filtered by occasion / favorite
 *   - wardrobe.createOutfit    (write)  — compose a named outfit from
 *                                         garment ids
 *   - wardrobe.tryOn           (write)  — render the user wearing the
 *                                         outfit; wraps the existing
 *                                         picture/generate-with-reference
 *                                         endpoint with resolved refs
 *
 * Space scope: garments and outfits live in the active space. meImages
 * (the face/body references needed for try-on) likewise space-scoped
 * after the v40 migration. Everything in this module filters client-
 * side (after mana-sync pull) on `row.spaceId === ctx.spaceId`, matching
 * the webapp's scopedForModule behaviour.
 *
 * Plan: docs/plans/wardrobe-module.md M5.
 */

import { z } from 'zod';
import { decryptRecordFields, encryptRecordFields } from '@mana/shared-crypto';
import { pullAll, pushInsert } from '../sync-client.ts';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const GARMENTS_APP_ID = 'wardrobe';
const GARMENTS_TABLE = 'wardrobeGarments';
const GARMENT_ENCRYPTED_FIELDS = [
	'name',
	'brand',
	'color',
	'size',
	'material',
	'tags',
	'notes',
] as const;

const OUTFITS_APP_ID = 'wardrobe';
const OUTFITS_TABLE = 'wardrobeOutfits';
const OUTFIT_ENCRYPTED_FIELDS = ['name', 'description', 'tags'] as const;

const ME_APP_ID = 'profile';
const ME_TABLE = 'meImages';
const ME_ENCRYPTED_FIELDS = ['label', 'tags'] as const;

const SYNC_URL = () => process.env.MANA_SYNC_URL ?? 'http://localhost:3050';
const PICTURE_API_URL = () => process.env.MANA_API_URL ?? 'http://localhost:3060';
const CLIENT_ID = () => process.env.MANA_MCP_CLIENT_ID ?? 'mana-mcp';

function syncCfg(ctx: ToolContext) {
	return { baseUrl: SYNC_URL(), jwt: ctx.jwt, clientId: CLIENT_ID() };
}

// ─── Domain shapes (zod) ──────────────────────────────────────────

const garmentCategory = z.enum([
	'top',
	'bottom',
	'dress',
	'outerwear',
	'shoes',
	'bag',
	'accessory',
	'glasses',
	'jewelry',
	'hat',
	'other',
]);
type GarmentCategory = z.infer<typeof garmentCategory>;

const FACE_ONLY_CATEGORIES: ReadonlySet<GarmentCategory> = new Set([
	'accessory',
	'glasses',
	'jewelry',
	'hat',
]);

const outfitOccasion = z.enum([
	'casual',
	'work',
	'formal',
	'workout',
	'date',
	'travel',
	'event',
	'sleep',
	'other',
]);

const garmentSchema = z.object({
	id: z.string(),
	name: z.string(),
	category: garmentCategory,
	mediaIds: z.array(z.string()),
	brand: z.string().nullable(),
	color: z.string().nullable(),
	size: z.string().nullable(),
	material: z.string().nullable(),
	tags: z.array(z.string()),
	notes: z.string().nullable(),
});

const outfitSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	garmentIds: z.array(z.string()),
	occasion: outfitOccasion.nullable(),
	tags: z.array(z.string()),
	isFavorite: z.boolean(),
});

// Raw row shapes — fields beyond what we consume are tolerated.
interface RawGarmentRow {
	id?: string;
	name?: string;
	category?: string;
	mediaIds?: string[];
	brand?: string | null;
	color?: string | null;
	size?: string | null;
	material?: string | null;
	tags?: string[] | null;
	notes?: string | null;
	isArchived?: boolean;
	deletedAt?: string | null;
	spaceId?: string | null;
}

interface RawOutfitRow {
	id?: string;
	name?: string;
	description?: string | null;
	garmentIds?: string[];
	occasion?: string | null;
	tags?: string[] | null;
	isFavorite?: boolean;
	isArchived?: boolean;
	deletedAt?: string | null;
	spaceId?: string | null;
}

interface RawMeImageRow {
	id?: string;
	mediaId?: string;
	primaryFor?: string | null;
	deletedAt?: string | null;
	spaceId?: string | null;
}

// ─── wardrobe.listGarments ────────────────────────────────────────

const listGarmentsInput = z.object({
	category: garmentCategory.optional(),
	/** Intersection filter: rows must contain EVERY tag listed. Empty = no filter. */
	tags: z.array(z.string()).max(10).default([]),
	limit: z.number().int().positive().max(200).default(50),
});

const listGarmentsOutput = z.object({
	garments: z.array(garmentSchema),
});

export const wardrobeListGarments: ToolSpec<typeof listGarmentsInput, typeof listGarmentsOutput> =
	{
		name: 'wardrobe.listGarments',
		module: 'wardrobe',
		scope: 'user-space',
		policyHint: 'read',
		description:
			"List the caller's garments in the active space. Filter by `category` (closed enum) and/or `tags` (intersection — every listed tag must be present). Returns at most `limit` rows, newest first. Archived + soft-deleted items are excluded.",
		input: listGarmentsInput,
		output: listGarmentsOutput,
		encryptedFields: { table: GARMENTS_TABLE, fields: [...GARMENT_ENCRYPTED_FIELDS] },
		async handler(input, ctx) {
			const key = await ctx.getMasterKey();
			const res = await pullAll<RawGarmentRow>(syncCfg(ctx), GARMENTS_APP_ID, GARMENTS_TABLE);
			const alive = res.changes
				.filter((c) => c.op !== 'delete' && c.data)
				.map((c) => c.data as RawGarmentRow)
				.filter((row) => !row.deletedAt && !row.isArchived)
				.filter((row) => row.spaceId === ctx.spaceId);

			const decrypted = (await Promise.all(
				alive.map((row) =>
					decryptRecordFields(row as unknown as Record<string, unknown>, GARMENT_ENCRYPTED_FIELDS, key)
				)
			)) as unknown as RawGarmentRow[];

			const filtered = decrypted
				.filter((row): row is RawGarmentRow & { id: string; name: string; category: string } =>
					Boolean(row.id && row.name && row.category)
				)
				.filter((row) => !input.category || row.category === input.category)
				.filter((row) => {
					if (input.tags.length === 0) return true;
					const rowTags = new Set(row.tags ?? []);
					return input.tags.every((t) => rowTags.has(t));
				})
				.slice(0, input.limit);

			const garments = filtered.map((row) => ({
				id: row.id,
				name: row.name,
				category: row.category as GarmentCategory,
				mediaIds: row.mediaIds ?? [],
				brand: row.brand ?? null,
				color: row.color ?? null,
				size: row.size ?? null,
				material: row.material ?? null,
				tags: row.tags ?? [],
				notes: row.notes ?? null,
			}));

			ctx.logger.info('wardrobe.listGarments', {
				count: garments.length,
				category: input.category ?? 'all',
			});

			return { garments };
		},
	};

// ─── wardrobe.listOutfits ─────────────────────────────────────────

const listOutfitsInput = z.object({
	occasion: outfitOccasion.optional(),
	favoriteOnly: z.boolean().default(false),
	limit: z.number().int().positive().max(200).default(50),
});

const listOutfitsOutput = z.object({
	outfits: z.array(outfitSchema),
});

export const wardrobeListOutfits: ToolSpec<typeof listOutfitsInput, typeof listOutfitsOutput> = {
	name: 'wardrobe.listOutfits',
	module: 'wardrobe',
	scope: 'user-space',
	policyHint: 'read',
	description:
		"List the caller's outfits in the active space. Filter by `occasion` and/or `favoriteOnly`. The returned rows include garmentIds — use `wardrobe.listGarments` to resolve them to full rows when you need more than ids.",
	input: listOutfitsInput,
	output: listOutfitsOutput,
	encryptedFields: { table: OUTFITS_TABLE, fields: [...OUTFIT_ENCRYPTED_FIELDS] },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const res = await pullAll<RawOutfitRow>(syncCfg(ctx), OUTFITS_APP_ID, OUTFITS_TABLE);
		const alive = res.changes
			.filter((c) => c.op !== 'delete' && c.data)
			.map((c) => c.data as RawOutfitRow)
			.filter((row) => !row.deletedAt && !row.isArchived)
			.filter((row) => row.spaceId === ctx.spaceId);

		const decrypted = (await Promise.all(
			alive.map((row) =>
				decryptRecordFields(row as unknown as Record<string, unknown>, OUTFIT_ENCRYPTED_FIELDS, key)
			)
		)) as unknown as RawOutfitRow[];

		const filtered = decrypted
			.filter((row): row is RawOutfitRow & { id: string; name: string } =>
				Boolean(row.id && row.name)
			)
			.filter((row) => !input.occasion || row.occasion === input.occasion)
			.filter((row) => !input.favoriteOnly || row.isFavorite === true)
			.slice(0, input.limit);

		const outfits = filtered.map((row) => ({
			id: row.id,
			name: row.name,
			description: row.description ?? null,
			garmentIds: row.garmentIds ?? [],
			occasion: (row.occasion ?? null) as z.infer<typeof outfitOccasion> | null,
			tags: row.tags ?? [],
			isFavorite: row.isFavorite === true,
		}));

		ctx.logger.info('wardrobe.listOutfits', {
			count: outfits.length,
			occasion: input.occasion ?? 'all',
			favoriteOnly: input.favoriteOnly,
		});

		return { outfits };
	},
};

// ─── wardrobe.createOutfit ────────────────────────────────────────

const createOutfitInput = z.object({
	name: z.string().min(1).max(200),
	garmentIds: z.array(z.string()).min(1).max(16),
	description: z.string().max(2000).nullable().default(null),
	occasion: outfitOccasion.nullable().default(null),
	tags: z.array(z.string()).max(20).default([]),
});

const createOutfitOutput = z.object({
	outfit: outfitSchema,
});

export const wardrobeCreateOutfit: ToolSpec<typeof createOutfitInput, typeof createOutfitOutput> =
	{
		name: 'wardrobe.createOutfit',
		module: 'wardrobe',
		scope: 'user-space',
		policyHint: 'write',
		description:
			"Compose a new outfit in the active space. `garmentIds` must reference garments the caller owns in the same space — the server will persist whatever you pass (there's no cross-space validation here), so call `wardrobe.listGarments` first to confirm the ids.",
		input: createOutfitInput,
		output: createOutfitOutput,
		encryptedFields: { table: OUTFITS_TABLE, fields: [...OUTFIT_ENCRYPTED_FIELDS] },
		async handler(input, ctx) {
			const key = await ctx.getMasterKey();
			const id = crypto.randomUUID();
			const plaintext = {
				id,
				name: input.name,
				description: input.description,
				garmentIds: input.garmentIds,
				occasion: input.occasion,
				tags: input.tags,
				isFavorite: false,
			};

			const encrypted = await encryptRecordFields(
				plaintext as unknown as Record<string, unknown>,
				OUTFIT_ENCRYPTED_FIELDS,
				key
			);

			await pushInsert(syncCfg(ctx), OUTFITS_APP_ID, {
				table: OUTFITS_TABLE,
				id,
				spaceId: ctx.spaceId,
				data: encrypted,
			});

			ctx.logger.info('wardrobe.createOutfit', {
				outfitId: id,
				garmentCount: input.garmentIds.length,
				occasion: input.occasion ?? 'none',
			});

			return {
				outfit: {
					id,
					name: input.name,
					description: input.description,
					garmentIds: input.garmentIds,
					occasion: input.occasion,
					tags: input.tags,
					isFavorite: false,
				},
			};
		},
	};

// ─── wardrobe.tryOn ───────────────────────────────────────────────

const tryOnInput = z.object({
	outfitId: z.string(),
	/** Optional override; default is composed from the outfit's name + occasion. */
	prompt: z.string().max(2000).optional(),
	/**
	 * Force accessory-only mode (face-only render, square 1024×1024).
	 * Auto-detected when every garment in the outfit is in the face-
	 * only category set — pass true explicitly to override on mixed
	 * outfits (rare).
	 */
	accessoryOnly: z.boolean().optional(),
	quality: z.enum(['low', 'medium', 'high']).default('medium'),
});

const tryOnOutput = z.object({
	imageUrl: z.string(),
	mediaId: z.string(),
	prompt: z.string(),
	model: z.string(),
	referenceMediaIds: z.array(z.string()),
	mode: z.literal('edit'),
});

export const wardrobeTryOn: ToolSpec<typeof tryOnInput, typeof tryOnOutput> = {
	name: 'wardrobe.tryOn',
	module: 'wardrobe',
	// `write` rather than `destructive`: the result is additive (a new
	// image in the Picture gallery) and credits are consumed at the
	// standard picture-generation tarif. No existing data is overwritten.
	scope: 'user-space',
	policyHint: 'write',
	description:
		"Render the caller wearing the outfit using OpenAI gpt-image-2. Resolves the active space's primary face-ref (and body-ref when the outfit isn't accessory-only) from meImages, combines them with the outfit's garment photos, and calls the picture-generate-with-reference endpoint. Returns the generated image's URL + mana-media id. Consumes credits at the same tarif as text-to-image (medium = 10). Does NOT persist the result into the Picture gallery from here — that's deferred to avoid double-writes when a user is also on the page; treat this tool as a preview.",
	input: tryOnInput,
	output: tryOnOutput,
	async handler(input, ctx) {
		// 1. Fetch outfit + garments + meImages, decrypt what's needed.
		const key = await ctx.getMasterKey();

		const outfitsRes = await pullAll<RawOutfitRow>(
			syncCfg(ctx),
			OUTFITS_APP_ID,
			OUTFITS_TABLE
		);
		const outfit = outfitsRes.changes
			.filter((c) => c.op !== 'delete' && c.data)
			.map((c) => c.data as RawOutfitRow)
			.find(
				(row) =>
					row.id === input.outfitId && !row.deletedAt && row.spaceId === ctx.spaceId
			);
		if (!outfit) {
			throw new Error(`Outfit ${input.outfitId} not found in the active space`);
		}

		const decryptedOutfit = (await decryptRecordFields(
			outfit as unknown as Record<string, unknown>,
			OUTFIT_ENCRYPTED_FIELDS,
			key
		)) as unknown as RawOutfitRow;

		const garmentIds = decryptedOutfit.garmentIds ?? [];
		if (garmentIds.length === 0) {
			throw new Error('Outfit has no garments');
		}

		const garmentsRes = await pullAll<RawGarmentRow>(
			syncCfg(ctx),
			GARMENTS_APP_ID,
			GARMENTS_TABLE
		);
		const garmentSet = new Set(garmentIds);
		const relevantGarments = garmentsRes.changes
			.filter((c) => c.op !== 'delete' && c.data)
			.map((c) => c.data as RawGarmentRow)
			.filter(
				(row) =>
					row.id &&
					garmentSet.has(row.id) &&
					!row.deletedAt &&
					row.spaceId === ctx.spaceId
			);
		if (relevantGarments.length === 0) {
			throw new Error(
				'None of the outfit garments exist in the active space (moved or deleted?)'
			);
		}

		// Garment metadata we need (category, mediaIds) is plaintext; no
		// decrypt round-trip needed for ref composition.
		const garmentMediaIds = relevantGarments
			.map((g) => g.mediaIds?.[0])
			.filter((id): id is string => Boolean(id));
		if (garmentMediaIds.length === 0) {
			throw new Error('None of the outfit garments have a primary photo');
		}

		const meRes = await pullAll<RawMeImageRow>(syncCfg(ctx), ME_APP_ID, ME_TABLE);
		const liveMeImages = meRes.changes
			.filter((c) => c.op !== 'delete' && c.data)
			.map((c) => c.data as RawMeImageRow)
			.filter((row) => !row.deletedAt && row.spaceId === ctx.spaceId);

		const faceRef = liveMeImages.find((row) => row.primaryFor === 'face-ref');
		const bodyRef = liveMeImages.find((row) => row.primaryFor === 'body-ref');

		if (!faceRef?.mediaId) {
			throw new Error(
				'No primary face-ref meImage in the active space. Upload one via /profile/me-images.'
			);
		}

		// 2. Accessory-only detection.
		const allFaceOnly = relevantGarments.every((g) =>
			FACE_ONLY_CATEGORIES.has((g.category ?? 'other') as GarmentCategory)
		);
		const accessoryOnly = input.accessoryOnly ?? allFaceOnly;

		if (!accessoryOnly && !bodyRef?.mediaId) {
			throw new Error(
				'No primary body-ref meImage in the active space. Upload a fullbody photo via /profile/me-images, or pass accessoryOnly=true if the outfit is face-only.'
			);
		}

		// 3. Compose reference list respecting the 8-slot server cap.
		const referenceMediaIds: string[] = [faceRef.mediaId];
		if (!accessoryOnly && bodyRef?.mediaId) referenceMediaIds.push(bodyRef.mediaId);
		for (const id of garmentMediaIds) {
			if (referenceMediaIds.length >= 8) break;
			referenceMediaIds.push(id);
		}

		// 4. Compose prompt if none given.
		const outfitName = decryptedOutfit.name ?? 'Outfit';
		const effectivePrompt =
			input.prompt?.trim() ||
			(accessoryOnly
				? `Fotorealistisches Portrait von mir mit ${outfitName}, frontal, studio-Licht, neutraler Hintergrund, Fokus auf dem Accessoire`
				: `Fotorealistisches Portrait von mir im Outfit ${outfitName}, natürliches Licht, neutraler Hintergrund`);

		const size: '1024x1024' | '1024x1536' = accessoryOnly ? '1024x1024' : '1024x1536';

		// 5. Call the picture endpoint.
		const res = await fetch(`${PICTURE_API_URL()}/api/v1/picture/generate-with-reference`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${ctx.jwt}`,
			},
			body: JSON.stringify({
				prompt: effectivePrompt,
				referenceMediaIds,
				model: 'openai/gpt-image-2',
				quality: input.quality,
				size,
				n: 1,
			}),
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '<unreadable body>');
			throw new Error(
				`picture.generate-with-reference failed: ${res.status} ${res.statusText} — ${text.slice(0, 500)}`
			);
		}

		const data = (await res.json()) as {
			images?: Array<{ imageUrl: string; mediaId?: string }>;
			imageUrl?: string;
			mediaId?: string;
			prompt: string;
			model: string;
			referenceMediaIds?: string[];
		};
		const first =
			(data.images && data.images[0]) ??
			(data.imageUrl ? { imageUrl: data.imageUrl, mediaId: data.mediaId } : null);
		if (!first?.imageUrl || !first.mediaId) {
			throw new Error('picture endpoint returned no image');
		}

		ctx.logger.info('wardrobe.tryOn', {
			outfitId: input.outfitId,
			accessoryOnly,
			refs: referenceMediaIds.length,
		});

		return {
			imageUrl: first.imageUrl,
			mediaId: first.mediaId,
			prompt: data.prompt,
			model: data.model,
			referenceMediaIds: data.referenceMediaIds ?? referenceMediaIds,
			mode: 'edit' as const,
		};
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerWardrobeTools(): void {
	registerTool(wardrobeListGarments);
	registerTool(wardrobeListOutfits);
	registerTool(wardrobeCreateOutfit);
	registerTool(wardrobeTryOn);
}
