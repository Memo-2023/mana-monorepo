import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock drizzle-orm operators before any imports that use them
vi.mock('drizzle-orm', () => ({
	eq: vi.fn((_col, _val) => ({ type: 'eq' })),
	and: vi.fn((..._args) => ({ type: 'and' })),
	asc: vi.fn((_col) => ({ type: 'asc' })),
}));

const mockFindFirstTask = vi.fn();
const mockFindManyReminders = vi.fn();
const mockInsertReturning = vi.fn();
const mockDeleteWhere = vi.fn();

vi.mock('../db', () => ({
	db: {
		query: {
			tasks: { findFirst: (...args: unknown[]) => mockFindFirstTask(...args) },
			reminders: { findMany: (...args: unknown[]) => mockFindManyReminders(...args) },
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: () => mockInsertReturning(),
			})),
		})),
		delete: vi.fn(() => ({
			where: () => mockDeleteWhere(),
		})),
	},
	tasks: { id: 'id', userId: 'user_id' },
	reminders: {
		id: 'id',
		taskId: 'task_id',
		userId: 'user_id',
		minutesBefore: 'minutes_before',
	},
}));

// Import AFTER mocks
const { reminderRoutes } = await import('./reminders');

const TEST_USER_ID = 'test-user-id';

function createApp() {
	const app = new Hono();
	app.use('*', async (c, next) => {
		c.set('userId', TEST_USER_ID);
		return next();
	});
	app.route('/', reminderRoutes);
	return app;
}

const app = createApp();

function get(path: string) {
	return app.request(path);
}

function post(path: string, body: unknown) {
	return app.request(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function del(path: string) {
	return app.request(path, { method: 'DELETE' });
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ─── GET /tasks/:taskId/reminders ──────────────────────────────

describe('GET /tasks/:taskId/reminders', () => {
	it('returns reminders for a valid task', async () => {
		mockFindFirstTask.mockResolvedValue({ id: 'task-1', userId: TEST_USER_ID });
		mockFindManyReminders.mockResolvedValue([
			{ id: 'r-1', minutesBefore: 10, type: 'push' },
			{ id: 'r-2', minutesBefore: 60, type: 'email' },
		]);

		const res = await get('/tasks/task-1/reminders');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.reminders).toHaveLength(2);
		expect(data.reminders[0].id).toBe('r-1');
	});

	it('returns 404 if task not found', async () => {
		mockFindFirstTask.mockResolvedValue(null);

		const res = await get('/tasks/nonexistent/reminders');
		expect(res.status).toBe(404);

		const data = await res.json();
		expect(data.error).toBe('Task not found');
	});
});

// ─── POST /tasks/:taskId/reminders ─────────────────────────────

describe('POST /tasks/:taskId/reminders', () => {
	it('creates a reminder for a task with due date', async () => {
		const dueDate = new Date('2026-06-15T14:00:00Z');
		mockFindFirstTask.mockResolvedValue({
			id: 'task-1',
			userId: TEST_USER_ID,
			dueDate: dueDate.toISOString(),
		});
		mockInsertReturning.mockResolvedValue([
			{
				id: 'r-new',
				taskId: 'task-1',
				minutesBefore: 30,
				type: 'push',
				reminderTime: new Date(dueDate.getTime() - 30 * 60 * 1000).toISOString(),
			},
		]);

		const res = await post('/tasks/task-1/reminders', {
			minutesBefore: 30,
			type: 'push',
		});
		expect(res.status).toBe(201);

		const data = await res.json();
		expect(data.reminder.id).toBe('r-new');
		expect(data.reminder.minutesBefore).toBe(30);
	});

	it('defaults type to push', async () => {
		mockFindFirstTask.mockResolvedValue({
			id: 'task-1',
			userId: TEST_USER_ID,
			dueDate: '2026-06-15T14:00:00Z',
		});
		mockInsertReturning.mockResolvedValue([{ id: 'r-new', type: 'push' }]);

		const res = await post('/tasks/task-1/reminders', { minutesBefore: 15 });
		expect(res.status).toBe(201);
	});

	it('returns 404 if task not found', async () => {
		mockFindFirstTask.mockResolvedValue(null);

		const res = await post('/tasks/nonexistent/reminders', {
			minutesBefore: 30,
		});
		expect(res.status).toBe(404);
	});

	it('returns 400 if task has no due date', async () => {
		mockFindFirstTask.mockResolvedValue({
			id: 'task-1',
			userId: TEST_USER_ID,
			dueDate: null,
		});

		const res = await post('/tasks/task-1/reminders', { minutesBefore: 30 });
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toContain('without due date');
	});
});

// ─── DELETE /reminders/:id ─────────────────────────────────────

describe('DELETE /reminders/:id', () => {
	it('deletes an existing reminder', async () => {
		const mockFindFirstReminder = vi.fn().mockResolvedValue({
			id: 'r-1',
			userId: TEST_USER_ID,
		});
		// Override the reminders findFirst for this test
		const { db } = await import('../db');
		(db.query as Record<string, unknown>).reminders = { findFirst: mockFindFirstReminder };
		mockDeleteWhere.mockResolvedValue(undefined);

		const res = await del('/reminders/r-1');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('returns 404 if reminder not found', async () => {
		const { db } = await import('../db');
		(db.query as Record<string, unknown>).reminders = {
			findFirst: vi.fn().mockResolvedValue(null),
		};

		const res = await del('/reminders/nonexistent');
		expect(res.status).toBe(404);

		const data = await res.json();
		expect(data.error).toBe('Reminder not found');
	});
});
