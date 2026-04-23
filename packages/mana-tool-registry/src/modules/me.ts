/**
 * Me — tools that let Agents and MCP clients act on the user's own
 * reference pool (meImages, plan docs/plans/me-images-and-reference-
 * generation.md). Two tools only:
 *
 *   - me.listReferenceImages — which of the user's face/body shots
 *     are currently opted-in for AI use. Read-only, pulled through
 *     mana-sync so RLS applies and the Persona Runner cannot see
 *     another tenant's pool.
 *
 *   - me.generateWithReference — proxy over the M3 edit endpoint.
 *     The actual OpenAI /v1/images/edits multipart is handled by
 *     apps/api; this tool exists so a Persona ("Stil-Coach",
 *     "Outfit-Buddy") can trigger generations without re-hosting the
 *     multipart logic or hardcoding OpenAI knowledge in the runner.
 *
 * meImages are stored under the `profile` sync appId (matches the
 * web app's module.config.ts). Only `label` and `tags` are encrypted
 * there — kind, primaryFor, usage, mediaId, urls, dimensions stay
 * plaintext because the generator UI filters by them.
 */

import { z } from 'zod';
import { decryptRecordFields } from '@mana/shared-crypto';
import { pullAll } from '../sync-client.ts';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const APP_ID = 'profile';
const TABLE = 'meImages';
const ENCRYPTED_FIELDS = ['label', 'tags'] as const;

const SYNC_URL = () => process.env.MANA_SYNC_URL ?? 'http://localhost:3050';
const PICTURE_API_URL = () => process.env.MANA_API_URL ?? 'http://localhost:3060';
const CLIENT_ID = () => process.env.MANA_MCP_CLIENT_ID ?? 'mana-mcp';

function syncCfg(ctx: ToolContext) {
	return { baseUrl: SYNC_URL(), jwt: ctx.jwt, clientId: CLIENT_ID() };
}

// ─── Domain shapes ────────────────────────────────────────────────

const meImageKind = z.enum(['face', 'fullbody', 'halfbody', 'hands', 'reference']);
const meImagePrimarySlot = z.enum(['avatar', 'face-ref', 'body-ref']);

const meImageSchema = z.object({
	id: z.string(),
	mediaId: z.string(),
	kind: meImageKind,
	label: z.string().nullable(),
	primaryFor: meImagePrimarySlot.nullable(),
	publicUrl: z.string().nullable(),
	thumbnailUrl: z.string().nullable(),
	width: z.number().nullable(),
	height: z.number().nullable(),
});

// Raw row shape we expect from mana-sync for meImages. Fields beyond
// what we care about are ignored — see the web-app types for the
// full shape (LocalMeImage).
interface RawMeImageRow {
	id?: string;
	mediaId?: string;
	kind?: string;
	label?: string | null;
	primaryFor?: string | null;
	publicUrl?: string | null;
	thumbnailUrl?: string | null;
	width?: number | null;
	height?: number | null;
	usage?: { aiReference?: boolean } | null;
	deletedAt?: string | null;
}

// ─── me.listReferenceImages ───────────────────────────────────────

const listInput = z.object({
	/** Optional kind filter. Omit to get every opted-in reference. */
	kind: meImageKind.optional(),
});

const listOutput = z.object({
	images: z.array(meImageSchema),
});

export const meListReferenceImages: ToolSpec<typeof listInput, typeof listOutput> = {
	name: 'me.listReferenceImages',
	module: 'me',
	scope: 'user-space',
	policyHint: 'read',
	description:
		"List the user's meImages that are explicitly opted in for AI reference use (usage.aiReference=true). The returned mediaIds are exactly what `me.generateWithReference` will accept. Excludes soft-deleted rows. Optional `kind` filter narrows to 'face', 'fullbody', 'halfbody', 'hands', or 'reference'.",
	input: listInput,
	output: listOutput,
	// label + tags are encrypted in the web-app's crypto registry; this
	// tool declaration keeps the audit (pnpm run check:crypto in future
	// iterations) aware that we decrypt label on read.
	encryptedFields: { table: TABLE, fields: [...ENCRYPTED_FIELDS] },
	async handler(input, ctx) {
		// ZK users will hit the error at ctx.getMasterKey() below; that's
		// fine — for ZK users the server genuinely cannot decrypt labels
		// and the right behaviour is to surface the error to the caller.
		const key = await ctx.getMasterKey();

		const res = await pullAll<RawMeImageRow>(syncCfg(ctx), APP_ID, TABLE);
		const alive = res.changes
			.filter((c) => c.op !== 'delete' && c.data)
			.map((c) => c.data as RawMeImageRow)
			.filter((row) => !row.deletedAt);

		const optedIn = alive.filter((row) => row.usage?.aiReference === true);
		const kindFiltered = input.kind ? optedIn.filter((row) => row.kind === input.kind) : optedIn;

		// Decrypt label + tags on the server side (same pattern as notes.search).
		const decrypted = (await Promise.all(
			kindFiltered.map((row) =>
				decryptRecordFields(row as unknown as Record<string, unknown>, ENCRYPTED_FIELDS, key)
			)
		)) as unknown as RawMeImageRow[];

		const images = decrypted
			.filter((row): row is RawMeImageRow & { id: string; mediaId: string } =>
				Boolean(row.id && row.mediaId)
			)
			.map((row) => ({
				id: row.id,
				mediaId: row.mediaId,
				kind: (row.kind ?? 'reference') as z.infer<typeof meImageKind>,
				label: row.label ?? null,
				primaryFor: (row.primaryFor ?? null) as z.infer<typeof meImagePrimarySlot> | null,
				publicUrl: row.publicUrl ?? null,
				thumbnailUrl: row.thumbnailUrl ?? null,
				width: row.width ?? null,
				height: row.height ?? null,
			}));

		ctx.logger.info('me.listReferenceImages', {
			count: images.length,
			kindFilter: input.kind ?? 'all',
		});

		return { images };
	},
};

// ─── me.generateWithReference ─────────────────────────────────────

const generateInput = z.object({
	prompt: z.string().min(1).max(4000),
	/**
	 * mana-media ids from `me.listReferenceImages`. apps/api will verify
	 * ownership again server-side, so mistakes here are caught with 404.
	 * Capped at 4 to match the M3 endpoint's own limit.
	 */
	referenceMediaIds: z.array(z.string()).min(1).max(4),
	quality: z.enum(['low', 'medium', 'high']).default('medium'),
	size: z.enum(['1024x1024', '1536x1024', '1024x1536', 'auto']).default('1024x1024'),
	n: z.number().int().min(1).max(4).default(1),
});

const generatedImageSchema = z.object({
	mediaId: z.string(),
	imageUrl: z.string(),
	thumbnailUrl: z.string().optional(),
});

const generateOutput = z.object({
	images: z.array(generatedImageSchema),
	prompt: z.string(),
	model: z.string(),
	referenceMediaIds: z.array(z.string()),
	mode: z.literal('edit'),
});

export const meGenerateWithReference: ToolSpec<typeof generateInput, typeof generateOutput> = {
	name: 'me.generateWithReference',
	module: 'me',
	scope: 'user-space',
	// `write` rather than `destructive`: credits are consumed, but the
	// result is purely additive (new image rows, no overwrites). A
	// future policy pass may still want to require explicit user consent
	// since credits have real cost; that lives in the consumer's policy
	// config, not in this hint.
	policyHint: 'write',
	description:
		"Run an OpenAI gpt-image-2 edit using the user's opted-in meImages as references. Pass mediaIds obtained from `me.listReferenceImages`. Consumes credits at the same rate as text-to-image generation (3/10/25 per quality, times n). Returns the generated images' mana-media ids + URLs; they are also persisted in the Picture module's gallery.",
	input: generateInput,
	output: generateOutput,
	async handler(input, ctx) {
		const url = `${PICTURE_API_URL()}/api/v1/picture/generate-with-reference`;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${ctx.jwt}`,
			},
			body: JSON.stringify({
				prompt: input.prompt,
				referenceMediaIds: input.referenceMediaIds,
				model: 'openai/gpt-image-2',
				quality: input.quality,
				size: input.size,
				n: input.n,
			}),
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '<unreadable body>');
			throw new Error(
				`mana-api /picture/generate-with-reference failed: ${res.status} ${res.statusText} — ${text.slice(0, 500)}`
			);
		}

		const data = (await res.json()) as {
			images?: Array<{ mediaId?: string; imageUrl?: string; thumbnailUrl?: string }>;
			prompt?: string;
			model?: string;
			referenceMediaIds?: string[];
		};

		const images = (data.images ?? [])
			.filter((img): img is { mediaId: string; imageUrl: string; thumbnailUrl?: string } =>
				Boolean(img.mediaId && img.imageUrl)
			)
			.map((img) => ({
				mediaId: img.mediaId,
				imageUrl: img.imageUrl,
				thumbnailUrl: img.thumbnailUrl,
			}));

		ctx.logger.info('me.generateWithReference', {
			count: images.length,
			references: input.referenceMediaIds.length,
		});

		return {
			images,
			prompt: data.prompt ?? input.prompt,
			model: data.model ?? 'openai/gpt-image-2',
			referenceMediaIds: data.referenceMediaIds ?? input.referenceMediaIds,
			mode: 'edit' as const,
		};
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerMeTools(): void {
	registerTool(meListReferenceImages);
	registerTool(meGenerateWithReference);
}
