/**
 * Notes — lightweight markdown notes, flat structure.
 *
 * Encrypted module: `notes` table is encrypted in the web-app registry as
 *   notes: entry<LocalNote>(['title', 'content'])
 *
 * AppId `notes` — matches the Dexie sync appId used by the web-app
 * notes store.
 */

import { z } from 'zod';
import { decryptRecordFields, encryptRecordFields } from '@mana/shared-crypto';
import { pullAll, pushInsert } from '../sync-client.ts';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const APP_ID = 'notes';
const TABLE = 'notes';
const ENCRYPTED_FIELDS = ['title', 'content'] as const;
const SYNC_URL = () => process.env.MANA_SYNC_URL ?? 'http://localhost:3050';
const CLIENT_ID = () => process.env.MANA_MCP_CLIENT_ID ?? 'mana-mcp';

// ─── Domain shape ─────────────────────────────────────────────────

const noteSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	content: z.string(),
	color: z.string().nullable(),
	isPinned: z.boolean(),
	isArchived: z.boolean(),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

type Note = z.infer<typeof noteSchema>;
type EncryptedNote = Record<string, unknown>;

function syncCfg(ctx: ToolContext) {
	return { baseUrl: SYNC_URL(), jwt: ctx.jwt, clientId: CLIENT_ID() };
}

// ─── notes.create ─────────────────────────────────────────────────

const createInput = z.object({
	title: z.string().min(1).max(500),
	content: z.string().max(200_000).default(''),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.nullable()
		.default(null),
	isPinned: z.boolean().default(false),
});

const createOutput = z.object({ note: noteSchema });

export const notesCreate: ToolSpec<typeof createInput, typeof createOutput> = {
	name: 'notes.create',
	module: 'notes',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Create a new markdown note in the active space. `content` supports full markdown. Values are encrypted before storage; the returned note is the plaintext snapshot.',
	input: createInput,
	output: createOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const now = new Date().toISOString();

		const plaintext: Note = {
			id: crypto.randomUUID(),
			title: input.title,
			content: input.content,
			color: input.color,
			isPinned: input.isPinned,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
		};

		const encrypted = await encryptRecordFields(
			plaintext as unknown as Record<string, unknown>,
			ENCRYPTED_FIELDS,
			key
		);

		await pushInsert(syncCfg(ctx), APP_ID, {
			table: TABLE,
			id: plaintext.id,
			spaceId: ctx.spaceId,
			data: encrypted,
		});

		ctx.logger.info('notes.create', { noteId: plaintext.id, spaceId: ctx.spaceId });
		return { note: plaintext };
	},
};

// ─── notes.search ─────────────────────────────────────────────────

const searchInput = z.object({
	query: z.string().max(500).default(''),
	includeArchived: z.boolean().default(false),
	limit: z.number().int().positive().max(100).default(20),
});

const searchOutput = z.object({
	notes: z.array(noteSchema),
});

export const notesSearch: ToolSpec<typeof searchInput, typeof searchOutput> = {
	name: 'notes.search',
	module: 'notes',
	scope: 'user-space',
	policyHint: 'read',
	description:
		'Search notes by case-insensitive substring match against title+content. Empty query returns the most recent notes. Decryption happens server-side after pull; the returned notes are plaintext.',
	input: searchInput,
	output: searchOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const res = await pullAll<EncryptedNote>(syncCfg(ctx), APP_ID, TABLE);
		const alive = res.changes.filter((c) => c.op !== 'delete' && c.data).map((c) => c.data!);

		const decrypted = (await Promise.all(
			alive.map((row) => decryptRecordFields(row, ENCRYPTED_FIELDS, key))
		)) as unknown as Note[];

		const q = input.query.toLowerCase().trim();
		const filtered = decrypted
			.filter((n) => input.includeArchived || !n.isArchived)
			.filter((n) => {
				if (!q) return true;
				return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
			})
			.slice(0, input.limit);

		return { notes: filtered };
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerNotesTools(): void {
	registerTool(notesCreate);
	registerTool(notesSearch);
}
