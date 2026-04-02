/**
 * Space Service for Memoro Web
 * Handles space management and collaboration via memoro-server (Hono/Bun).
 */

import { env } from '$lib/config/env';
import { MemoroEvents } from '@manacore/shared-utils/analytics';

const API = () => env.server.memoroUrl.replace(/\/$/, '');

// Types

export interface Memo {
	id: string;
	title: string;
	user_id: string;
	source?: any;
	style?: any;
	is_pinned?: boolean;
	is_archived?: boolean;
	is_public?: boolean;
	metadata?: any;
	created_at?: string;
	updated_at?: string;
}

export interface SpaceInvite {
	id: string;
	email: string;
	invitee_id?: string;
	role: string;
	status: string;
	created_at: string;
	responded_at?: string;
	invited_by: string;
	users?: {
		email: string;
		first_name?: string;
		last_name?: string;
	};
}

export interface Space {
	id: string;
	name: string;
	description?: string;
	memoCount?: number;
	isDefault?: boolean;
	color?: string;
	created_at?: string;
	updated_at?: string;
	owner_id?: string;
	app_id?: string;
	credits?: number;
	isOwner?: boolean;
	roles?: {
		members: {
			[userId: string]: {
				role: string;
				added_at: string;
				added_by: string;
			};
		};
	};
	apps?: { name: string; slug: string };
}

export interface CreateSpaceRequest {
	name: string;
	description?: string;
	color?: string;
}

export interface UpdateSpaceRequest {
	name: string;
	description?: string;
	color?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function headers(token: string) {
	return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function throwOnError(response: Response, fallback: string) {
	if (!response.ok) {
		let msg = fallback;
		try {
			const d = await response.json();
			msg = d.error || d.message || msg;
		} catch {}
		throw new Error(msg);
	}
}

function mapSpace(s: any): Space {
	return {
		id: s.id,
		name: s.name,
		description: s.description || '',
		memoCount: s.memo_count || 0,
		isDefault: s.is_default || false,
		color: s.color || '#4CAF50',
		created_at: s.created_at,
		updated_at: s.updated_at,
		owner_id: s.owner_id,
		app_id: s.app_id,
		credits: s.credits || 0,
		roles: s.roles,
		apps: s.apps,
		isOwner: s.isOwner || false,
	};
}

// ── Service ────────────────────────────────────────────────────────────────────

class SpaceService {
	async getSpaces(token: string): Promise<Space[]> {
		const r = await fetch(`${API()}/api/v1/spaces`, { headers: headers(token) });
		await throwOnError(r, 'Error fetching spaces');
		const d = await r.json();
		return (d.spaces ?? []).map(mapSpace);
	}

	async getSpace(spaceId: string, token: string): Promise<Space> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}`, { headers: headers(token) });
		await throwOnError(r, 'Error fetching space');
		const d = await r.json();
		return mapSpace(d.space);
	}

	async createSpace(spaceData: CreateSpaceRequest, token: string): Promise<Space> {
		const r = await fetch(`${API()}/api/v1/spaces`, {
			method: 'POST',
			headers: headers(token),
			body: JSON.stringify({ name: spaceData.name, description: spaceData.description }),
		});
		await throwOnError(r, 'Error creating space');
		const d = await r.json();
		MemoroEvents.spaceCreated();
		return mapSpace(d.space);
	}

	async updateSpace(spaceId: string, spaceData: UpdateSpaceRequest, token: string): Promise<Space> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}`, {
			method: 'PUT',
			headers: headers(token),
			body: JSON.stringify(spaceData),
		});
		await throwOnError(r, 'Error updating space');
		return this.getSpace(spaceId, token);
	}

	async deleteSpace(spaceId: string, token: string): Promise<boolean> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}`, {
			method: 'DELETE',
			headers: headers(token),
		});
		await throwOnError(r, 'Error deleting space');
		MemoroEvents.spaceDeleted();
		return true;
	}

	async leaveSpace(spaceId: string, token: string): Promise<boolean> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}/leave`, {
			method: 'POST',
			headers: headers(token),
		});
		await throwOnError(r, 'Error leaving space');
		MemoroEvents.spaceLeft();
		return true;
	}

	async getSpaceMemos(spaceId: string, token: string): Promise<Memo[]> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}/memos`, {
			headers: headers(token),
		});
		await throwOnError(r, 'Error fetching space memos');
		const d = await r.json();
		return d.memos ?? [];
	}

	async linkMemoToSpace(memoId: string, spaceId: string, token: string): Promise<boolean> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}/memos/link`, {
			method: 'POST',
			headers: headers(token),
			body: JSON.stringify({ memoId }),
		});
		await throwOnError(r, 'Error linking memo to space');
		MemoroEvents.memoLinkedToSpace();
		return true;
	}

	async unlinkMemoFromSpace(memoId: string, spaceId: string, token: string): Promise<boolean> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}/memos/unlink`, {
			method: 'POST',
			headers: headers(token),
			body: JSON.stringify({ memoId }),
		});
		await throwOnError(r, 'Error unlinking memo from space');
		MemoroEvents.memoUnlinkedFromSpace();
		return true;
	}

	async getSpaceInvites(spaceId: string, token: string): Promise<SpaceInvite[]> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}/invites`, {
			headers: headers(token),
		});
		await throwOnError(r, 'Error fetching space invites');
		const d = await r.json();
		return d.invites ?? [];
	}

	async inviteUserToSpace(
		spaceId: string,
		email: string,
		_role: string,
		token: string
	): Promise<string> {
		const r = await fetch(`${API()}/api/v1/spaces/${spaceId}/invite`, {
			method: 'POST',
			headers: headers(token),
			body: JSON.stringify({ email }),
		});
		await throwOnError(r, 'Error inviting user to space');
		const d = await r.json();
		MemoroEvents.inviteSent();
		return d.invite?.id ?? d.inviteId;
	}

	async resendInvite(inviteId: string, token: string): Promise<boolean> {
		const r = await fetch(`${API()}/api/v1/spaces/invites/${inviteId}/resend`, {
			method: 'POST',
			headers: headers(token),
		});
		await throwOnError(r, 'Error resending invite');
		return true;
	}

	async cancelInvite(inviteId: string, token: string): Promise<boolean> {
		const r = await fetch(`${API()}/api/v1/spaces/invites/${inviteId}`, {
			method: 'DELETE',
			headers: headers(token),
		});
		await throwOnError(r, 'Error canceling invite');
		return true;
	}

	async acceptInvite(inviteId: string, token: string): Promise<boolean> {
		const r = await fetch(`${API()}/api/v1/invites/accept`, {
			method: 'POST',
			headers: headers(token),
			body: JSON.stringify({ inviteId }),
		});
		await throwOnError(r, 'Error accepting invite');
		MemoroEvents.inviteAccepted();
		return true;
	}

	async declineInvite(inviteId: string, token: string): Promise<boolean> {
		const r = await fetch(`${API()}/api/v1/invites/decline`, {
			method: 'POST',
			headers: headers(token),
			body: JSON.stringify({ inviteId }),
		});
		await throwOnError(r, 'Error declining invite');
		MemoroEvents.inviteDeclined();
		return true;
	}

	async getUserInvites(token: string): Promise<SpaceInvite[]> {
		const r = await fetch(`${API()}/api/v1/invites/pending`, { headers: headers(token) });
		await throwOnError(r, 'Error fetching user invites');
		const d = await r.json();
		return d.invites ?? [];
	}
}

export const spaceService = new SpaceService();
