/**
 * Tests for space and invite routes.
 */

import { describe, it, expect, vi } from 'vitest';
import { app } from '../index';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@manacore/shared-hono', () => ({
	authMiddleware: () => async (c: any, next: any) => {
		c.set('userId', 'test-user-id');
		await next();
	},
	errorHandler: (err: any, c: any) => c.json({ error: err.message }, err.status ?? 500),
	notFoundHandler: (c: any) => c.json({ error: 'Not found' }, 404),
	validateCredits: vi.fn(),
	consumeCredits: vi.fn(),
	getBalance: vi.fn(),
}));

vi.mock('../services/memo', () => ({
	createMemoFromUploadedFile: vi.fn(),
	callAudioServer: vi.fn(),
	handleTranscriptionCompleted: vi.fn(),
	updateMemoProcessingStatus: vi.fn(),
}));

vi.mock('../services/headline', () => ({
	processHeadlineForMemo: vi.fn(),
}));

vi.mock('../lib/ai', () => ({
	generateText: vi.fn(),
}));

vi.mock('../services/space', () => {
	const space = { id: 'space-1', name: 'Test Space', owner_id: 'test-user-id' };
	const invite = { id: 'invite-1', space_id: 'space-1', email: 'user@example.com' };
	const memo = { id: 'memo-1', title: 'Test Memo' };
	return {
		getSpaces: vi.fn().mockResolvedValue([space]),
		createSpace: vi.fn().mockResolvedValue(space),
		getSpaceDetails: vi.fn().mockResolvedValue(space),
		deleteSpace: vi.fn().mockResolvedValue(undefined),
		leaveSpace: vi.fn().mockResolvedValue(undefined),
		linkMemoToSpace: vi.fn().mockResolvedValue(undefined),
		unlinkMemoFromSpace: vi.fn().mockResolvedValue(undefined),
		getSpaceMemos: vi.fn().mockResolvedValue({ memos: [memo] }),
		getSpaceInvites: vi.fn().mockResolvedValue([invite]),
		createInvite: vi.fn().mockResolvedValue(invite),
		acceptInvite: vi.fn().mockResolvedValue(undefined),
		declineInvite: vi.fn().mockResolvedValue(undefined),
		getPendingInvites: vi.fn().mockResolvedValue([invite]),
	};
});

const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockDelete = vi.fn();

vi.mock('../lib/notify', () => ({
	sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/supabase', () => ({
	createServiceClient: () => {
		const chain: any = {};
		chain.from = () => chain;
		chain.select = () => chain;
		chain.delete = () => {
			mockDelete();
			return chain;
		};
		chain.eq = () => chain;
		chain.single = () => mockSingle();
		return chain;
	},
}));

function post(path: string, body: unknown) {
	return app.request(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

// ── Space routes ─────────────────────────────────────────────────────────────

describe('GET /api/v1/spaces', () => {
	it('lists user spaces', async () => {
		const res = await app.request('/api/v1/spaces');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.spaces).toHaveLength(1);
		expect(data.total).toBe(1);
	});

	it('supports pagination', async () => {
		const res = await app.request('/api/v1/spaces?limit=10&offset=0');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.limit).toBe(10);
		expect(data.offset).toBe(0);
	});

	it('rejects invalid pagination', async () => {
		const res = await app.request('/api/v1/spaces?limit=200');
		expect(res.status).toBe(400);
	});
});

describe('POST /api/v1/spaces', () => {
	it('creates a space', async () => {
		const res = await post('/api/v1/spaces', { name: 'My Space' });
		expect(res.status).toBe(201);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.space.name).toBe('Test Space');
	});

	it('creates a space with description', async () => {
		const res = await post('/api/v1/spaces', {
			name: 'My Space',
			description: 'A great space',
		});
		expect(res.status).toBe(201);
	});

	it('rejects empty name', async () => {
		const res = await post('/api/v1/spaces', { name: '' });
		expect(res.status).toBe(400);
	});

	it('rejects missing name', async () => {
		const res = await post('/api/v1/spaces', {});
		expect(res.status).toBe(400);
	});
});

describe('GET /api/v1/spaces/:id', () => {
	it('returns space details', async () => {
		const res = await app.request('/api/v1/spaces/space-1');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.space.id).toBe('space-1');
	});

	it('returns 403 for access denied', async () => {
		const { getSpaceDetails } = await import('../services/space');
		vi.mocked(getSpaceDetails).mockRejectedValueOnce(new Error('Access denied'));

		const res = await app.request('/api/v1/spaces/other-space');
		expect(res.status).toBe(403);
	});

	it('returns 404 for non-existent space', async () => {
		const { getSpaceDetails } = await import('../services/space');
		vi.mocked(getSpaceDetails).mockRejectedValueOnce(new Error('Space not found'));

		const res = await app.request('/api/v1/spaces/nonexistent');
		expect(res.status).toBe(404);
	});
});

describe('DELETE /api/v1/spaces/:id', () => {
	it('deletes a space', async () => {
		const res = await app.request('/api/v1/spaces/space-1', { method: 'DELETE' });
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('returns 403 if not owner', async () => {
		const { deleteSpace } = await import('../services/space');
		vi.mocked(deleteSpace).mockRejectedValueOnce(new Error('Only owner can delete'));

		const res = await app.request('/api/v1/spaces/space-1', { method: 'DELETE' });
		expect(res.status).toBe(403);
	});
});

describe('POST /api/v1/spaces/:id/leave', () => {
	it('leaves a space', async () => {
		const res = await post('/api/v1/spaces/space-1/leave', {});
		expect(res.status).toBe(200);
	});

	it('returns 400 if owner tries to leave', async () => {
		const { leaveSpace } = await import('../services/space');
		vi.mocked(leaveSpace).mockRejectedValueOnce(new Error('owner cannot leave'));

		const res = await post('/api/v1/spaces/space-1/leave', {});
		expect(res.status).toBe(400);
	});
});

describe('POST /api/v1/spaces/:id/memos/link', () => {
	it('links a memo to a space', async () => {
		const res = await post('/api/v1/spaces/space-1/memos/link', {
			memoId: '11111111-2222-3333-4444-555555555555',
		});
		expect(res.status).toBe(200);
	});

	it('rejects invalid memoId', async () => {
		const res = await post('/api/v1/spaces/space-1/memos/link', {
			memoId: 'not-a-uuid',
		});
		expect(res.status).toBe(400);
	});

	it('returns 403 if not a member', async () => {
		const { linkMemoToSpace } = await import('../services/space');
		vi.mocked(linkMemoToSpace).mockRejectedValueOnce(new Error('Not a member'));

		const res = await post('/api/v1/spaces/space-1/memos/link', {
			memoId: '11111111-2222-3333-4444-555555555555',
		});
		expect(res.status).toBe(403);
	});
});

describe('POST /api/v1/spaces/:id/memos/unlink', () => {
	it('unlinks a memo from a space', async () => {
		const res = await post('/api/v1/spaces/space-1/memos/unlink', {
			memoId: '11111111-2222-3333-4444-555555555555',
		});
		expect(res.status).toBe(200);
	});
});

describe('GET /api/v1/spaces/:id/memos', () => {
	it('lists space memos', async () => {
		const res = await app.request('/api/v1/spaces/space-1/memos');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.memos).toHaveLength(1);
	});

	it('returns 403 if not a member', async () => {
		const { getSpaceMemos } = await import('../services/space');
		vi.mocked(getSpaceMemos).mockRejectedValueOnce(new Error('Not a member'));

		const res = await app.request('/api/v1/spaces/other-space/memos');
		expect(res.status).toBe(403);
	});
});

describe('GET /api/v1/spaces/:id/invites', () => {
	it('lists space invites', async () => {
		const res = await app.request('/api/v1/spaces/space-1/invites');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.invites).toHaveLength(1);
	});
});

describe('POST /api/v1/spaces/:id/invite', () => {
	it('creates an invite', async () => {
		const res = await post('/api/v1/spaces/space-1/invite', {
			email: 'user@example.com',
		});
		expect(res.status).toBe(201);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('rejects invalid email', async () => {
		const res = await post('/api/v1/spaces/space-1/invite', {
			email: 'not-an-email',
		});
		expect(res.status).toBe(400);
	});
});

describe('POST /api/v1/spaces/invites/:inviteId/resend', () => {
	it('resends invite email', async () => {
		mockSingle
			.mockResolvedValueOnce({
				data: {
					id: 'invite-1',
					inviter_id: 'test-user-id',
					invitee_email: 'user@example.com',
					space_id: 'space-1',
					status: 'pending',
				},
				error: null,
			})
			.mockResolvedValueOnce({ data: { role: 'owner' }, error: null })
			.mockResolvedValueOnce({ data: { name: 'Test Space' }, error: null });

		const res = await post('/api/v1/spaces/invites/invite-1/resend', {});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('returns 404 for non-existent invite', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

		const res = await post('/api/v1/spaces/invites/nonexistent/resend', {});
		expect(res.status).toBe(404);
	});

	it('returns 400 if invite is not pending', async () => {
		mockSingle.mockResolvedValueOnce({
			data: {
				id: 'invite-1',
				inviter_id: 'test-user-id',
				invitee_email: 'user@example.com',
				space_id: 'space-1',
				status: 'accepted',
			},
			error: null,
		});

		const res = await post('/api/v1/spaces/invites/invite-1/resend', {});
		expect(res.status).toBe(400);
	});
});

describe('DELETE /api/v1/spaces/invites/:inviteId', () => {
	it('cancels an invite as inviter', async () => {
		mockSingle.mockResolvedValueOnce({
			data: { id: 'invite-1', inviter_id: 'test-user-id', space_id: 'space-1' },
			error: null,
		});
		mockSingle.mockResolvedValueOnce({
			data: { role: 'member' },
			error: null,
		});

		const res = await app.request('/api/v1/spaces/invites/invite-1', { method: 'DELETE' });
		expect(res.status).toBe(200);
	});

	it('returns 404 for non-existent invite', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

		const res = await app.request('/api/v1/spaces/invites/nonexistent', { method: 'DELETE' });
		expect(res.status).toBe(404);
	});

	it('returns 403 if not authorized', async () => {
		mockSingle.mockResolvedValueOnce({
			data: { id: 'invite-1', inviter_id: 'other-user', space_id: 'space-1' },
			error: null,
		});
		mockSingle.mockResolvedValueOnce({
			data: { role: 'member' },
			error: null,
		});

		const res = await app.request('/api/v1/spaces/invites/invite-1', { method: 'DELETE' });
		expect(res.status).toBe(403);
	});
});

// ── Invite routes (/api/v1/invites) ──────────────────────────────────────────

describe('GET /api/v1/invites/pending', () => {
	it('lists pending invites', async () => {
		const res = await app.request('/api/v1/invites/pending');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.invites).toHaveLength(1);
	});
});

describe('POST /api/v1/invites/accept', () => {
	it('accepts an invite', async () => {
		const res = await post('/api/v1/invites/accept', {
			inviteId: '11111111-2222-3333-4444-555555555555',
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('rejects invalid inviteId', async () => {
		const res = await post('/api/v1/invites/accept', { inviteId: 'not-a-uuid' });
		expect(res.status).toBe(400);
	});

	it('returns 404 for non-existent invite', async () => {
		const { acceptInvite } = await import('../services/space');
		vi.mocked(acceptInvite).mockRejectedValueOnce(new Error('Invite not found'));

		const res = await post('/api/v1/invites/accept', {
			inviteId: '11111111-2222-3333-4444-555555555555',
		});
		expect(res.status).toBe(404);
	});
});

describe('POST /api/v1/invites/decline', () => {
	it('declines an invite', async () => {
		const res = await post('/api/v1/invites/decline', {
			inviteId: '11111111-2222-3333-4444-555555555555',
		});
		expect(res.status).toBe(200);
	});

	it('returns 404 for already-processed invite', async () => {
		const { declineInvite } = await import('../services/space');
		vi.mocked(declineInvite).mockRejectedValueOnce(new Error('already processed'));

		const res = await post('/api/v1/invites/decline', {
			inviteId: '11111111-2222-3333-4444-555555555555',
		});
		expect(res.status).toBe(404);
	});
});
