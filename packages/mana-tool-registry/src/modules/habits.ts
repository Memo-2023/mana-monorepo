/**
 * Habits — agent-callable operations on the user's habits collection.
 *
 * Plaintext module: `habits` table is in the plaintext-allowlist
 * (no encrypted fields), so handlers write directly through the
 * mana-sync push protocol without any key-grant ceremony.
 *
 * Wire shape mirrors LocalHabit in
 * apps/mana/apps/web/src/lib/modules/habits/types.ts — keep in sync.
 */

import { z } from 'zod';
import { pullAll, pushInsert, push } from '../sync-client.ts';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const APP_ID = 'habits';
const TABLE = 'habits';
const SYNC_URL = () => process.env.MANA_SYNC_URL ?? 'http://localhost:3050';
const CLIENT_ID = () => process.env.MANA_MCP_CLIENT_ID ?? 'mana-mcp';

// ─── Domain shape (must match LocalHabit on the client) ───────────

const habitSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	icon: z.string(),
	color: z.string(),
	targetPerDay: z.number().int().nullable(),
	defaultDuration: z.number().int().nullable(),
	order: z.number().int(),
	isArchived: z.boolean(),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

type Habit = z.infer<typeof habitSchema>;

function syncCfg(ctx: ToolContext) {
	return { baseUrl: SYNC_URL(), jwt: ctx.jwt, clientId: CLIENT_ID() };
}

// ─── habits.create ────────────────────────────────────────────────

const createInput = z.object({
	title: z.string().min(1).max(120),
	icon: z.string().min(1).max(40).default('star'),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.default('#6366f1'),
	targetPerDay: z.number().int().positive().nullable().default(null),
	defaultDuration: z.number().int().positive().nullable().default(null),
});

const createOutput = z.object({ habit: habitSchema });

export const habitsCreate: ToolSpec<typeof createInput, typeof createOutput> = {
	name: 'habits.create',
	module: 'habits',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Create a new habit (e.g. "Coffee", "Workout"). Returns the created habit. Use `targetPerDay` for habits with a daily count goal.',
	input: createInput,
	output: createOutput,
	async handler(input, ctx) {
		const now = new Date().toISOString();
		const existing = await pullAll<Habit>(syncCfg(ctx), APP_ID, TABLE);
		const order = existing.changes.filter((c) => c.op !== 'delete').length;

		const habit: Habit = {
			id: crypto.randomUUID(),
			title: input.title,
			icon: input.icon,
			color: input.color,
			targetPerDay: input.targetPerDay,
			defaultDuration: input.defaultDuration,
			order,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
		};

		await pushInsert(syncCfg(ctx), APP_ID, {
			table: TABLE,
			id: habit.id,
			spaceId: ctx.spaceId,
			data: habit as unknown as Record<string, unknown>,
		});

		ctx.logger.info('habits.create', { habitId: habit.id, spaceId: ctx.spaceId });
		return { habit };
	},
};

// ─── habits.list ──────────────────────────────────────────────────

const listInput = z.object({
	includeArchived: z.boolean().default(false),
});

const listOutput = z.object({
	habits: z.array(habitSchema),
});

export const habitsList: ToolSpec<typeof listInput, typeof listOutput> = {
	name: 'habits.list',
	module: 'habits',
	scope: 'user-space',
	policyHint: 'read',
	description:
		'List all habits in the active space. Set `includeArchived: true` to include archived habits.',
	input: listInput,
	output: listOutput,
	async handler(input, ctx) {
		const res = await pullAll<Habit>(syncCfg(ctx), APP_ID, TABLE);
		const habits = res.changes
			.filter((c) => c.op !== 'delete' && c.data)
			.map((c) => c.data as Habit)
			.filter((h) => input.includeArchived || !h.isArchived);
		return { habits };
	},
};

// ─── habits.update ────────────────────────────────────────────────

const updateInput = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(120).optional(),
	icon: z.string().min(1).max(40).optional(),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.optional(),
	targetPerDay: z.number().int().positive().nullable().optional(),
	defaultDuration: z.number().int().positive().nullable().optional(),
});

const updateOutput = z.object({ ok: z.literal(true) });

export const habitsUpdate: ToolSpec<typeof updateInput, typeof updateOutput> = {
	name: 'habits.update',
	module: 'habits',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Update fields on an existing habit. Only the provided fields are changed; others stay as-is.',
	input: updateInput,
	output: updateOutput,
	async handler(input, ctx) {
		const now = new Date().toISOString();
		const fields: Record<string, { value: unknown; updatedAt: string }> = {};
		for (const [k, v] of Object.entries(input)) {
			if (k === 'id' || v === undefined) continue;
			fields[k] = { value: v, updatedAt: now };
		}
		fields.updatedAt = { value: now, updatedAt: now };

		await push(syncCfg(ctx), APP_ID, [
			{
				table: TABLE,
				id: input.id,
				op: 'update',
				spaceId: ctx.spaceId,
				fields,
			},
		]);

		ctx.logger.info('habits.update', { habitId: input.id, fields: Object.keys(fields) });
		return { ok: true };
	},
};

// ─── habits.archive ───────────────────────────────────────────────

const archiveInput = z.object({
	id: z.string().uuid(),
	archived: z.boolean().default(true),
});

const archiveOutput = z.object({ ok: z.literal(true) });

export const habitsArchive: ToolSpec<typeof archiveInput, typeof archiveOutput> = {
	name: 'habits.archive',
	module: 'habits',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Archive (or unarchive) a habit. Archived habits stay in history but disappear from the active list.',
	input: archiveInput,
	output: archiveOutput,
	async handler(input, ctx) {
		const now = new Date().toISOString();
		await push(syncCfg(ctx), APP_ID, [
			{
				table: TABLE,
				id: input.id,
				op: 'update',
				spaceId: ctx.spaceId,
				fields: {
					isArchived: { value: input.archived, updatedAt: now },
					updatedAt: { value: now, updatedAt: now },
				},
			},
		]);
		ctx.logger.info('habits.archive', { habitId: input.id, archived: input.archived });
		return { ok: true };
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerHabitsTools(): void {
	registerTool(habitsCreate);
	registerTool(habitsList);
	registerTool(habitsUpdate);
	registerTool(habitsArchive);
}
