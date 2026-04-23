/**
 * Journal — daily freeform entries (Tagebuch).
 *
 * Encrypted module: `journalEntries` table is encrypted in the web-app
 * registry as
 *   journalEntries: entry<LocalJournalEntry>(['title', 'content'])
 *
 * `mood`, `entryDate`, `tags`, `wordCount` stay plaintext (indexed for
 * stats and insights views).
 */

import { z } from 'zod';
import { encryptRecordFields } from '@mana/shared-crypto';
import { pushInsert } from '../sync-client.ts';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const APP_ID = 'journal';
const TABLE = 'journalEntries';
const ENCRYPTED_FIELDS = ['title', 'content'] as const;
const SYNC_URL = () => process.env.MANA_SYNC_URL ?? 'http://localhost:3050';
const CLIENT_ID = () => process.env.MANA_MCP_CLIENT_ID ?? 'mana-mcp';

const MOODS = [
	'dankbar',
	'glücklich',
	'zufrieden',
	'neutral',
	'nachdenklich',
	'traurig',
	'gestresst',
	'wütend',
] as const;

const entrySchema = z.object({
	id: z.string().uuid(),
	title: z.string().nullable(),
	content: z.string(),
	entryDate: z.string(),
	mood: z.enum(MOODS).nullable(),
	tags: z.array(z.string()),
	wordCount: z.number().int().nonnegative(),
	isPinned: z.boolean(),
	isFavorite: z.boolean(),
	isArchived: z.boolean(),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

type Entry = z.infer<typeof entrySchema>;

function syncCfg(ctx: ToolContext) {
	return { baseUrl: SYNC_URL(), jwt: ctx.jwt, clientId: CLIENT_ID() };
}

// ─── journal.add ──────────────────────────────────────────────────

const addInput = z.object({
	title: z.string().max(500).nullable().default(null),
	content: z.string().min(1).max(200_000),
	entryDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	mood: z.enum(MOODS).nullable().default(null),
	tags: z.array(z.string()).default([]),
});

const addOutput = z.object({ entry: entrySchema });

export const journalAdd: ToolSpec<typeof addInput, typeof addOutput> = {
	name: 'journal.add',
	module: 'journal',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Write a journal entry. Defaults to today if `entryDate` is omitted. Title and content are encrypted; mood, tags, and the date stay plaintext for stats aggregation.',
	input: addInput,
	output: addOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const now = new Date();
		const today = now.toISOString().slice(0, 10);

		const plaintext: Entry = {
			id: crypto.randomUUID(),
			title: input.title,
			content: input.content,
			entryDate: input.entryDate ?? today,
			mood: input.mood,
			tags: input.tags,
			wordCount: input.content.split(/\s+/).filter(Boolean).length,
			isPinned: false,
			isFavorite: false,
			isArchived: false,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
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

		ctx.logger.info('journal.add', {
			entryId: plaintext.id,
			entryDate: plaintext.entryDate,
			wordCount: plaintext.wordCount,
		});
		return { entry: plaintext };
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerJournalTools(): void {
	registerTool(journalAdd);
}
