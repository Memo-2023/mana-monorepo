/**
 * MCP Tool Executor — handles tools/call requests by routing to
 * sync database reads and writes.
 *
 * Read tools query sync_changes to reconstruct current user state.
 * Write tools INSERT into sync_changes — records appear on the user's
 * devices on their next sync cycle.
 *
 * Uses the same sync_changes pattern as mana-ai's iteration-writer,
 * with actor attribution as 'system:mcp'.
 */

import { AI_TOOL_CATALOG_BY_NAME } from '@mana/shared-ai';
import { readLatestRecords, writeRecord } from './sync-db';

export interface McpToolResult {
	[key: string]: unknown;
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}

// ── Tool handler registry ──────────────────────────────────────
type ToolHandler = (args: Record<string, unknown>, userId: string) => Promise<McpToolResult>;

const handlers = new Map<string, ToolHandler>();

function register(name: string, handler: ToolHandler): void {
	handlers.set(name, handler);
}

// ── Helpers ────────────────────────────────────────────────────

function ok(text: string, data?: unknown): McpToolResult {
	return {
		content: [{ type: 'text', text: data ? `${text}\n\n${JSON.stringify(data, null, 2)}` : text }],
	};
}

function err(text: string): McpToolResult {
	return { content: [{ type: 'text', text }], isError: true };
}

function nowIso(): string {
	return new Date().toISOString();
}

function fieldTs(fields: string[]): Record<string, string> {
	const ts = nowIso();
	return Object.fromEntries(fields.map((f) => [f, ts]));
}

// ── Todo tools ─────────────────────────────────────────────────

register('list_tasks', async (_args, userId) => {
	const records = await readLatestRecords(userId, 'todo', 'tasks');
	const filter = (_args.filter as string) ?? 'open';
	const limit = (_args.limit as number) ?? 20;
	const today = new Date().toISOString().split('T')[0];

	let tasks = records.map((r) => ({
		id: r.id as string,
		title: r.title as string,
		dueDate: r.dueDate as string | undefined,
		priority: r.priority as string | undefined,
		isCompleted: !!r.isCompleted,
	}));

	if (filter === 'open') tasks = tasks.filter((t) => !t.isCompleted);
	else if (filter === 'completed') tasks = tasks.filter((t) => t.isCompleted);
	else if (filter === 'overdue')
		tasks = tasks.filter((t) => !t.isCompleted && t.dueDate != null && t.dueDate < today);
	else if (filter === 'today') tasks = tasks.filter((t) => !t.isCompleted && t.dueDate === today);

	const list = tasks.slice(0, limit);
	if (list.length === 0) return ok(`Keine ${filter} Tasks.`);

	const lines = list.map(
		(t) =>
			`- [${t.id}] ${t.title}${t.dueDate ? ` (fällig ${t.dueDate})` : ''}${t.priority === 'high' ? ' [HOHE PRIO]' : ''}`
	);
	return ok(`${list.length} Tasks (${filter}):\n${lines.join('\n')}`, list);
});

register('get_task_stats', async (_args, userId) => {
	const records = await readLatestRecords(userId, 'todo', 'tasks');
	const today = new Date().toISOString().split('T')[0];
	const total = records.length;
	const completed = records.filter((r) => r.isCompleted).length;
	const overdue = records.filter(
		(r) => !r.isCompleted && r.dueDate != null && (r.dueDate as string) < today
	).length;
	const dueToday = records.filter((r) => !r.isCompleted && (r.dueDate as string) === today).length;

	return ok(
		`${total} Tasks: ${completed} erledigt, ${overdue} überfällig, ${dueToday} heute fällig`,
		{ total, completed, overdue, dueToday, open: total - completed }
	);
});

register('create_task', async (args, userId) => {
	const taskId = crypto.randomUUID();
	const now = nowIso();
	const data = {
		id: taskId,
		userId,
		title: args.title as string,
		description: (args.description as string) ?? '',
		dueDate: (args.dueDate as string) ?? null,
		priority: (args.priority as string) ?? 'medium',
		isCompleted: false,
		order: 0,
		createdAt: now,
		updatedAt: now,
	};

	await writeRecord(userId, 'todo', 'tasks', taskId, 'insert', data, fieldTs(Object.keys(data)));

	return ok(`Task "${args.title}" erstellt (ID: ${taskId}). Erscheint beim nächsten Sync.`, {
		id: taskId,
	});
});

register('complete_task', async (args, userId) => {
	const taskId = args.taskId as string;
	const now = nowIso();

	await writeRecord(
		userId,
		'todo',
		'tasks',
		taskId,
		'update',
		{
			isCompleted: true,
			completedAt: now,
			updatedAt: now,
		},
		fieldTs(['isCompleted', 'completedAt', 'updatedAt'])
	);

	return ok(`Task ${taskId} als erledigt markiert.`);
});

// ── Notes tools ────────────────────────────────────────────────

register('list_notes', async (args, userId) => {
	const records = await readLatestRecords(userId, 'notes', 'notes');
	const limit = (args.limit as number) ?? 30;
	const query = (args.query as string)?.toLowerCase();

	let notes = records.map((r) => ({
		id: r.id as string,
		title: (r.title as string) ?? '(Ohne Titel)',
		excerpt: ((r.content as string) ?? '').slice(0, 100),
	}));

	if (query) {
		notes = notes.filter(
			(n) => n.title.toLowerCase().includes(query) || n.excerpt.toLowerCase().includes(query)
		);
	}

	const list = notes.slice(0, limit);
	if (list.length === 0) return ok('Keine Notizen gefunden.');

	const lines = list.map((n) => `- [${n.id}] ${n.title}: ${n.excerpt}…`);
	return ok(`${list.length} Notizen:\n${lines.join('\n')}`, list);
});

register('create_note', async (args, userId) => {
	const noteId = crypto.randomUUID();
	const now = nowIso();
	const data = {
		id: noteId,
		userId,
		title: (args.title as string) ?? '',
		content: (args.content as string) ?? '',
		createdAt: now,
		updatedAt: now,
	};

	await writeRecord(userId, 'notes', 'notes', noteId, 'insert', data, fieldTs(Object.keys(data)));
	return ok(`Notiz "${data.title || '(Ohne Titel)'}" erstellt (ID: ${noteId}).`, { id: noteId });
});

// ── Calendar tools ─────────────────────────────────────────────

register('get_todays_events', async (_args, userId) => {
	const records = await readLatestRecords(userId, 'calendar', 'timeBlocks');
	const today = new Date().toISOString().split('T')[0];

	const events = records
		.filter(
			(r) =>
				r.type === 'event' &&
				r.sourceModule === 'calendar' &&
				(r.startDate as string)?.startsWith(today)
		)
		.map((r) => ({
			id: r.sourceId as string,
			title: r.title as string,
			startTime: r.startDate as string,
			endTime: r.endDate as string,
		}))
		.sort((a, b) => a.startTime.localeCompare(b.startTime));

	if (events.length === 0) return ok('Keine Termine heute.');
	const lines = events.map((e) => `- ${e.startTime.slice(11, 16)} ${e.title}`);
	return ok(`${events.length} Termine heute:\n${lines.join('\n')}`, events);
});

// ── Contacts tools ─────────────────────────────────────────────

register('get_contacts', async (_args, userId) => {
	const records = await readLatestRecords(userId, 'contacts', 'contacts');
	const contacts = records
		.filter((r) => !r.isArchived)
		.map((r) => ({
			id: r.id as string,
			name: [r.firstName, r.lastName].filter(Boolean).join(' '),
			company: r.company as string | undefined,
			email: r.email as string | undefined,
		}));

	if (contacts.length === 0) return ok('Keine Kontakte.');
	return ok(`${contacts.length} Kontakte`, contacts);
});

register('create_contact', async (args, userId) => {
	const contactId = crypto.randomUUID();
	const now = nowIso();
	const data = {
		id: contactId,
		userId,
		firstName: args.firstName as string,
		lastName: (args.lastName as string) ?? '',
		email: (args.email as string) ?? '',
		phone: (args.phone as string) ?? '',
		company: (args.company as string) ?? '',
		notes: (args.notes as string) ?? '',
		createdAt: now,
		updatedAt: now,
	};

	await writeRecord(
		userId,
		'contacts',
		'contacts',
		contactId,
		'insert',
		data,
		fieldTs(Object.keys(data))
	);

	return ok(`Kontakt "${args.firstName}" erstellt (ID: ${contactId}).`, { id: contactId });
});

// ── Habits tools ───────────────────────────────────────────────

register('get_habits', async (_args, userId) => {
	const records = await readLatestRecords(userId, 'habits', 'habits');
	const habits = records.map((r) => ({
		id: r.id as string,
		title: r.title as string,
		icon: r.icon as string,
	}));
	if (habits.length === 0) return ok('Keine Habits.');
	return ok(`${habits.length} Habits`, habits);
});

// ── Entry point ────────────────────────────────────────────────

/**
 * Execute an MCP tool call. Routes to registered handlers or returns
 * a "not yet implemented" message for tools without a handler.
 */
export async function executeMcpTool(
	toolName: string,
	args: Record<string, unknown>,
	userId: string
): Promise<McpToolResult> {
	const schema = AI_TOOL_CATALOG_BY_NAME.get(toolName);
	if (!schema) return err(`Unknown tool: ${toolName}`);

	const handler = handlers.get(toolName);
	if (handler) {
		try {
			return await handler(args, userId);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			return err(`Tool "${toolName}" failed: ${msg}`);
		}
	}

	// Fallback for tools without a handler yet
	return ok(
		`[Mana MCP] Tool "${toolName}" (${schema.module}) ist noch nicht serverseitig implementiert.\n` +
			`Args: ${JSON.stringify(args)}\n` +
			`Nutze die Mana-App unter mana.how für diese Aktion.`
	);
}
