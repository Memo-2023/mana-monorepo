/**
 * Mood — daily mood log entries (Stimmungstracking).
 *
 * Encrypted fields match the web-app registry entry for `moodEntries`:
 *   moodEntries: entry<LocalMoodEntry>(['withWhom', 'notes'])
 *
 * Emotion + activity + date + level stay plaintext so the stats views
 * (trends, cross-activity comparisons) can operate without a key-unlock
 * round-trip. Free-text "with whom" and "notes" fields hold personal
 * context that would embarrass the user if it leaked.
 *
 * Multiple entries per day supported — the web app renders them as a
 * timeline, not a single-value daily picker. "Today" here means "all
 * entries whose `date` is YYYY-MM-DD of server-clock today".
 */

import { z } from 'zod';
import { decryptRecordFields, encryptRecordFields } from '@mana/shared-crypto';
import { pullAll, pushInsert } from '../sync-client.ts';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const APP_ID = 'mood';
const TABLE = 'moodEntries';
const ENCRYPTED_FIELDS = ['withWhom', 'notes'] as const;
const SYNC_URL = () => process.env.MANA_SYNC_URL ?? 'http://localhost:3050';
const CLIENT_ID = () => process.env.MANA_MCP_CLIENT_ID ?? 'mana-mcp';

// Taxonomy copied verbatim from apps/mana/.../modules/mood/types.ts —
// keep in sync if the web app adds new emotions / activities. The
// CoreEmotion and ActivityContext unions are the authoritative source.
const EMOTIONS = [
	'happy',
	'calm',
	'energized',
	'grateful',
	'excited',
	'loved',
	'hopeful',
	'neutral',
	'bored',
	'tired',
	'sad',
	'anxious',
	'angry',
	'stressed',
	'frustrated',
	'overwhelmed',
] as const;

const ACTIVITIES = [
	'work',
	'exercise',
	'social',
	'alone',
	'commute',
	'eating',
	'resting',
	'creative',
	'outdoors',
	'screen',
	'chores',
	'other',
] as const;

// ─── Domain shape ─────────────────────────────────────────────────

const entrySchema = z.object({
	id: z.string().uuid(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	time: z.string().regex(/^\d{2}:\d{2}$/),
	level: z.number().int().min(1).max(10),
	emotion: z.enum(EMOTIONS),
	secondaryEmotions: z.array(z.enum(EMOTIONS)),
	activity: z.enum(ACTIVITIES).nullable(),
	withWhom: z.string(),
	notes: z.string(),
	tags: z.array(z.string()),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

type Entry = z.infer<typeof entrySchema>;
type EncryptedEntry = Record<string, unknown>;

function syncCfg(ctx: ToolContext) {
	return { baseUrl: SYNC_URL(), jwt: ctx.jwt, clientId: CLIENT_ID() };
}

// ─── mood.log ─────────────────────────────────────────────────────

const logInput = z.object({
	level: z.number().int().min(1).max(10),
	emotion: z.enum(EMOTIONS),
	secondaryEmotions: z.array(z.enum(EMOTIONS)).max(5).default([]),
	activity: z.enum(ACTIVITIES).nullable().default(null),
	withWhom: z.string().max(500).default(''),
	notes: z.string().max(5000).default(''),
	tags: z.array(z.string().max(60)).max(20).default([]),
	/**
	 * ISO `YYYY-MM-DD` + `HH:mm`. Both default to server-clock now.
	 * Personas logging "yesterday's mood" pass these explicitly.
	 */
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	time: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.optional(),
});

const logOutput = z.object({ entry: entrySchema });

export const moodLog: ToolSpec<typeof logInput, typeof logOutput> = {
	name: 'mood.log',
	module: 'mood',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Log a mood entry. `level` is 1–10 (1 = worst, 10 = best). `emotion` is the primary feeling; up to 5 `secondaryEmotions` can nuance it. `withWhom` and `notes` are encrypted before storage.',
	input: logInput,
	output: logOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const now = new Date();

		const plaintext: Entry = {
			id: crypto.randomUUID(),
			date: input.date ?? now.toISOString().slice(0, 10),
			time: input.time ?? now.toISOString().slice(11, 16),
			level: input.level,
			emotion: input.emotion,
			secondaryEmotions: input.secondaryEmotions,
			activity: input.activity,
			withWhom: input.withWhom,
			notes: input.notes,
			tags: input.tags,
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

		ctx.logger.info('mood.log', {
			entryId: plaintext.id,
			date: plaintext.date,
			level: plaintext.level,
			emotion: plaintext.emotion,
		});
		return { entry: plaintext };
	},
};

// ─── mood.today ───────────────────────────────────────────────────

const todayInput = z.object({
	/**
	 * Optional override for the server's "today" (YYYY-MM-DD). Lets the
	 * runner simulate retrospective analysis ("how was I last Tuesday?")
	 * without an extra tool.
	 */
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
});

const listOutput = z.object({ entries: z.array(entrySchema) });

export const moodToday: ToolSpec<typeof todayInput, typeof listOutput> = {
	name: 'mood.today',
	module: 'mood',
	scope: 'user-space',
	policyHint: 'read',
	description:
		'List every mood entry for today (or the given date). Multiple entries per day are normal — the web app timelines them. Entries returned decrypted.',
	input: todayInput,
	output: listOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const target = input.date ?? new Date().toISOString().slice(0, 10);

		const res = await pullAll<EncryptedEntry>(syncCfg(ctx), APP_ID, TABLE);
		const alive = res.changes.filter((c) => c.op !== 'delete' && c.data).map((c) => c.data!);

		const decrypted = (await Promise.all(
			alive.map((row) => decryptRecordFields(row, ENCRYPTED_FIELDS, key))
		)) as unknown as Entry[];

		const entries = decrypted
			.filter((e) => e.date === target)
			.sort((a, b) => a.time.localeCompare(b.time));

		return { entries };
	},
};

// ─── mood.recent ──────────────────────────────────────────────────

const recentInput = z.object({
	days: z.number().int().min(1).max(90).default(7),
	limit: z.number().int().min(1).max(200).default(50),
});

export const moodRecent: ToolSpec<typeof recentInput, typeof listOutput> = {
	name: 'mood.recent',
	module: 'mood',
	scope: 'user-space',
	policyHint: 'read',
	description:
		'Return mood entries from the last `days` days (default 7), newest first, capped at `limit`. Useful for "how has my week been?" reflection. Entries decrypted.',
	input: recentInput,
	output: listOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
			.toISOString()
			.slice(0, 10);

		const res = await pullAll<EncryptedEntry>(syncCfg(ctx), APP_ID, TABLE);
		const alive = res.changes.filter((c) => c.op !== 'delete' && c.data).map((c) => c.data!);

		const decrypted = (await Promise.all(
			alive.map((row) => decryptRecordFields(row, ENCRYPTED_FIELDS, key))
		)) as unknown as Entry[];

		const entries = decrypted
			.filter((e) => e.date >= cutoff)
			.sort((a, b) => {
				if (a.date !== b.date) return b.date.localeCompare(a.date);
				return b.time.localeCompare(a.time);
			})
			.slice(0, input.limit);

		return { entries };
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerMoodTools(): void {
	registerTool(moodLog);
	registerTool(moodToday);
	registerTool(moodRecent);
}
