/**
 * Todo — agent-callable task operations.
 *
 * Encrypted module: field list matches the web-app registry entry for
 * the `tasks` table:
 *   tasks: { enabled: true, fields: ['title', 'description', 'subtasks', 'metadata'] }
 *
 * Keep in lockstep with apps/mana/apps/web/src/lib/data/crypto/registry.ts —
 * a CI audit will diff these in M4.
 */

import { z } from 'zod';
import { decryptRecordFields, encryptRecordFields } from '@mana/shared-crypto';
import { pullAll, push, pushInsert } from '../sync-client.ts';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const APP_ID = 'todo';
const TABLE = 'tasks';
const ENCRYPTED_FIELDS = ['title', 'description', 'subtasks', 'metadata'] as const;
const SYNC_URL = () => process.env.MANA_SYNC_URL ?? 'http://localhost:3050';
const CLIENT_ID = () => process.env.MANA_MCP_CLIENT_ID ?? 'mana-mcp';

// ─── Domain shape (subset of LocalTask — fields the MCP surface needs) ──

const subtaskSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	isCompleted: z.boolean(),
	completedAt: z.string().datetime().nullable().optional(),
	order: z.number().int(),
});

const taskSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	description: z.string().optional(),
	priority: z.enum(['low', 'medium', 'high', 'urgent']),
	isCompleted: z.boolean(),
	completedAt: z.string().datetime().nullable().optional(),
	dueDate: z.string().datetime().nullable().optional(),
	order: z.number().int(),
	subtasks: z.array(subtaskSchema).nullable().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

type Task = z.infer<typeof taskSchema>;
type EncryptedTask = Record<string, unknown>;

function syncCfg(ctx: ToolContext) {
	return { baseUrl: SYNC_URL(), jwt: ctx.jwt, clientId: CLIENT_ID() };
}

// ─── todo.create ──────────────────────────────────────────────────

const createInput = z.object({
	title: z.string().min(1).max(500),
	description: z.string().max(10_000).optional(),
	priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
	dueDate: z.string().datetime().nullable().default(null),
});

const createOutput = z.object({ task: taskSchema });

export const todoCreate: ToolSpec<typeof createInput, typeof createOutput> = {
	name: 'todo.create',
	module: 'todo',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Create a new task. Title is required; description, priority, dueDate are optional. Returns the created task (decrypted).',
	input: createInput,
	output: createOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const now = new Date().toISOString();

		const existing = await pullAll<EncryptedTask>(syncCfg(ctx), APP_ID, TABLE);
		const order = existing.changes.filter((c) => c.op !== 'delete').length;

		const plaintext: Task = {
			id: crypto.randomUUID(),
			title: input.title,
			description: input.description,
			priority: input.priority,
			isCompleted: false,
			completedAt: null,
			dueDate: input.dueDate,
			order,
			subtasks: null,
			metadata: undefined,
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

		ctx.logger.info('todo.create', { taskId: plaintext.id, spaceId: ctx.spaceId });
		return { task: plaintext };
	},
};

// ─── todo.list ────────────────────────────────────────────────────

const listInput = z.object({
	includeCompleted: z.boolean().default(false),
	limit: z.number().int().positive().max(500).default(50),
});

const listOutput = z.object({ tasks: z.array(taskSchema) });

export const todoList: ToolSpec<typeof listInput, typeof listOutput> = {
	name: 'todo.list',
	module: 'todo',
	scope: 'user-space',
	policyHint: 'read',
	description:
		'List tasks in the active space. Completed tasks excluded by default. Values are returned decrypted.',
	input: listInput,
	output: listOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const res = await pullAll<EncryptedTask>(syncCfg(ctx), APP_ID, TABLE);
		const alive = res.changes.filter((c) => c.op !== 'delete' && c.data).map((c) => c.data!);

		const decrypted = await Promise.all(
			alive.map((row) => decryptRecordFields(row, ENCRYPTED_FIELDS, key))
		);

		const tasks = decrypted
			.filter((t) => input.includeCompleted || !t.isCompleted)
			.slice(0, input.limit) as unknown as Task[];

		return { tasks };
	},
};

// ─── todo.complete ────────────────────────────────────────────────

const completeInput = z.object({
	id: z.string().uuid(),
});

const completeOutput = z.object({ ok: z.literal(true) });

export const todoComplete: ToolSpec<typeof completeInput, typeof completeOutput> = {
	name: 'todo.complete',
	module: 'todo',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Mark a task as completed by id. Idempotent — completing an already-completed task is a no-op on the server side.',
	input: completeInput,
	output: completeOutput,
	async handler(input, ctx) {
		const now = new Date().toISOString();
		await push(syncCfg(ctx), APP_ID, [
			{
				table: TABLE,
				id: input.id,
				op: 'update',
				spaceId: ctx.spaceId,
				fields: {
					isCompleted: { value: true, updatedAt: now },
					completedAt: { value: now, updatedAt: now },
					updatedAt: { value: now, updatedAt: now },
				},
			},
		]);
		ctx.logger.info('todo.complete', { taskId: input.id });
		return { ok: true };
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerTodoTools(): void {
	registerTool(todoCreate);
	registerTool(todoList);
	registerTool(todoComplete);
}
