import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
	eq: vi.fn((_col, _val) => ({ type: 'eq' })),
	sql: vi.fn((strings: TemplateStringsArray) => strings.join('')),
}));

const mockSelectFromWhere = vi.fn();
const mockDeleteWhere = vi.fn();

vi.mock('../db', () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: () => mockSelectFromWhere(),
			})),
		})),
		delete: vi.fn(() => ({
			where: () => mockDeleteWhere(),
		})),
	},
	tasks: { userId: 'user_id' },
	projects: { userId: 'user_id' },
	reminders: { userId: 'user_id' },
}));

// Mock serviceAuthMiddleware to pass through
vi.mock('@manacore/shared-hono', () => ({
	serviceAuthMiddleware: () => async (_c: unknown, next: () => Promise<void>) => next(),
}));

const { adminRoutes } = await import('./admin');

const app = new Hono();
app.route('/admin', adminRoutes);

function get(path: string) {
	return app.request(path);
}

function del(path: string) {
	return app.request(path, { method: 'DELETE' });
}

// ─── GET /admin/user-data/:userId ──────────────────────────────

describe('GET /admin/user-data/:userId', () => {
	it('returns user data counts', async () => {
		mockSelectFromWhere
			.mockResolvedValueOnce([{ count: 42 }]) // tasks
			.mockResolvedValueOnce([{ count: 3 }]) // projects
			.mockResolvedValueOnce([{ count: 5 }]); // reminders

		const res = await get('/admin/user-data/user-123');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.userId).toBe('user-123');
		expect(data.counts.tasks).toBe(42);
		expect(data.counts.projects).toBe(3);
		expect(data.counts.reminders).toBe(5);
	});

	it('returns zero counts for user with no data', async () => {
		mockSelectFromWhere
			.mockResolvedValueOnce([{ count: 0 }])
			.mockResolvedValueOnce([{ count: 0 }])
			.mockResolvedValueOnce([{ count: 0 }]);

		const res = await get('/admin/user-data/empty-user');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.counts.tasks).toBe(0);
		expect(data.counts.projects).toBe(0);
		expect(data.counts.reminders).toBe(0);
	});

	it('handles null count results', async () => {
		mockSelectFromWhere
			.mockResolvedValueOnce([undefined])
			.mockResolvedValueOnce([undefined])
			.mockResolvedValueOnce([undefined]);

		const res = await get('/admin/user-data/user-x');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.counts.tasks).toBe(0);
		expect(data.counts.projects).toBe(0);
		expect(data.counts.reminders).toBe(0);
	});
});

// ─── DELETE /admin/user-data/:userId ───────────────────────────

describe('DELETE /admin/user-data/:userId', () => {
	it('deletes all user data (GDPR)', async () => {
		mockDeleteWhere.mockResolvedValue(undefined);

		const res = await del('/admin/user-data/user-123');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.userId).toBe('user-123');
		expect(data.deleted).toBe(true);
		expect(data.message).toBe('All user data deleted');
	});
});
