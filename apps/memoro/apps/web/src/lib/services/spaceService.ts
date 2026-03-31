/**
 * Space Service for Memoro Web
 * Handles space management and collaboration features
 *
 * Pattern adapted from memoro_app/features/spaces/services/spaceService.ts
 */

import { env } from '$lib/config/env';

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
	apps?: {
		name: string;
		slug: string;
	};
}

export interface CreateSpaceRequest {
	name: string;
	appId?: string;
	description?: string;
	color?: string;
}

export interface UpdateSpaceRequest {
	name: string;
	description?: string;
	color?: string;
}

class SpaceService {
	private apiUrl: string;
	private appId: string;

	constructor() {
		this.apiUrl = env.middleware.memoroUrl.replace(/\/$/, '');
		this.appId = env.middleware.appId;
	}

	/**
	 * Get all spaces for current user from the unified API
	 */
	async getSpaces(appToken: string): Promise<Space[]> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			const response = await fetch(`${this.apiUrl}/memoro/spaces`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Error fetching spaces: ${response.statusText}`);
			}

			const data = await response.json();
			console.log(data);

			// Transform the response to match our Space interface
			return data.spaces.map((space: any) => ({
				id: space.id,
				name: space.name,
				description: space.description || '',
				memoCount: space.memo_count || 0,
				isDefault: space.is_default || false,
				color: space.color || '#4CAF50',
				created_at: space.created_at,
				updated_at: space.updated_at,
				owner_id: space.owner_id,
				app_id: space.app_id,
				credits: space.credits || 0,
				roles: space.roles,
				isOwner: space.isOwner || false,
			}));
		} catch (error) {
			console.error('Failed to fetch spaces:', error);
			throw error;
		}
	}

	/**
	 * Get a specific space by ID
	 */
	async getSpace(spaceId: string, appToken: string): Promise<Space> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			const response = await fetch(`${this.apiUrl}/memoro/spaces/${spaceId}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Error fetching space: ${response.statusText}`);
			}

			const data = await response.json();

			// Transform the response to match our Space interface
			return {
				id: data.space.id,
				name: data.space.name,
				description: data.space.description || '',
				memoCount: data.space.memo_count || 0,
				isDefault: data.space.is_default || false,
				color: data.space.color || '#4CAF50',
				created_at: data.space.created_at,
				updated_at: data.space.updated_at,
				owner_id: data.space.owner_id,
				app_id: data.space.app_id,
				credits: data.space.credits || 0,
				roles: data.space.roles,
				apps: data.space.apps,
				isOwner: data.space.isOwner || false,
			};
		} catch (error) {
			console.error(`Failed to fetch space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Create a new space
	 */
	async createSpace(spaceData: CreateSpaceRequest, appToken: string): Promise<Space> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			// Ensure appId is set
			if (!spaceData.appId) {
				spaceData.appId = this.appId;
			}

			// Prepare request data according to API docs
			const requestData = {
				name: spaceData.name,
			};

			const response = await fetch(`${this.apiUrl}/memoro/spaces`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Error creating space: ${response.statusText}`);
			}

			const data = await response.json();
			console.log('Create space response:', JSON.stringify(data, null, 2));

			// Handle both formats: {success, spaceId} or {space: {success, spaceId}}
			const success = data.success || (data.space && data.space.success);
			const spaceId = data.spaceId || (data.space && data.space.spaceId);

			if (!success) {
				throw new Error(data.error || (data.space && data.space.error) || 'Failed to create space');
			}

			if (!spaceId) {
				throw new Error('No space ID returned from server');
			}

			try {
				// Try to get the new space details
				return await this.getSpace(spaceId, appToken);
			} catch (fetchError) {
				console.log('Could not fetch newly created space details. Creating fallback space object.');

				// Create a fallback space object with minimal information
				return {
					id: spaceId,
					name: spaceData.name,
					description: '',
					memoCount: 0,
					isDefault: false,
					color: spaceData.color || '#4CAF50',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				};
			}
		} catch (error) {
			console.error('Failed to create space:', error);
			throw error;
		}
	}

	/**
	 * Update an existing space
	 */
	async updateSpace(
		spaceId: string,
		spaceData: UpdateSpaceRequest,
		appToken: string
	): Promise<Space> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			const response = await fetch(`${this.apiUrl}/memoro/spaces/${spaceId}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(spaceData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Error updating space: ${response.statusText}`);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to update space');
			}

			// Get the updated space details
			return this.getSpace(spaceId, appToken);
		} catch (error) {
			console.error(`Failed to update space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Delete a space
	 */
	async deleteSpace(spaceId: string, appToken: string): Promise<boolean> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.log(`Deleting space at: ${this.apiUrl}/memoro/spaces/${spaceId}`);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/${spaceId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				console.error(`Error response status: ${response.status}`);
				let errorMessage = `Error deleting space: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to delete space');
			}

			return true;
		} catch (error) {
			console.error(`Failed to delete space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Leave a space (for non-owners)
	 */
	async leaveSpace(spaceId: string, appToken: string): Promise<boolean> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.log(`Leaving space at: ${this.apiUrl}/memoro/spaces/${spaceId}/leave`);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/${spaceId}/leave`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				console.error(`Error response status: ${response.status}`);
				let errorMessage = `Error leaving space: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to leave space');
			}

			return true;
		} catch (error) {
			console.error(`Failed to leave space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Get all memos for a specific space
	 */
	async getSpaceMemos(spaceId: string, appToken: string): Promise<Memo[]> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.debug(
				`Fetching memos for space ${spaceId} from ${this.apiUrl}/memoro/spaces/${spaceId}/memos`
			);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/${spaceId}/memos`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				let errorMessage = `Error fetching space memos: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch (jsonError) {
					// If response is not JSON, use the status text
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			return data.memos || [];
		} catch (error) {
			console.error(`Failed to fetch memos for space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Link a memo to a space
	 */
	async linkMemoToSpace(memoId: string, spaceId: string, appToken: string): Promise<boolean> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.log(`Linking memo ${memoId} to space ${spaceId}`);

			const response = await fetch(`${this.apiUrl}/memoro/link-memo`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ memoId, spaceId }),
			});

			if (!response.ok) {
				console.error(`Error response status: ${response.status}`);
				let errorMessage = `Error linking memo to space: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			return data.success;
		} catch (error) {
			console.error(`Failed to link memo ${memoId} to space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Unlink a memo from a space
	 */
	async unlinkMemoFromSpace(memoId: string, spaceId: string, appToken: string): Promise<boolean> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.log(`Unlinking memo ${memoId} from space ${spaceId}`);

			const response = await fetch(`${this.apiUrl}/memoro/unlink-memo`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ memoId, spaceId }),
			});

			if (!response.ok) {
				console.error(`Error response status: ${response.status}`);
				let errorMessage = `Error unlinking memo from space: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			return data.success;
		} catch (error) {
			console.error(`Failed to unlink memo ${memoId} from space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Get all pending invites for a space
	 */
	async getSpaceInvites(spaceId: string, appToken: string): Promise<SpaceInvite[]> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.debug(`Fetching invites for space ${spaceId}`);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/${spaceId}/invites`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				let errorMessage = `Failed to get space invites: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			return data.invites || [];
		} catch (error) {
			console.error(`Failed to get invites for space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Invite a user to a space by email
	 */
	async inviteUserToSpace(
		spaceId: string,
		email: string,
		role: string,
		appToken: string
	): Promise<string> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.debug(`Inviting user ${email} to space ${spaceId} with role ${role}`);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/${spaceId}/invite`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, role }),
			});

			if (!response.ok) {
				let errorMessage = `Failed to invite user to space: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			return data.inviteId;
		} catch (error) {
			console.error(`Failed to invite user to space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Resend a space invitation
	 */
	async resendInvite(inviteId: string, appToken: string): Promise<boolean> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.debug(`Resending invite ${inviteId}`);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/invites/${inviteId}/resend`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				let errorMessage = `Failed to resend invitation: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			return true;
		} catch (error) {
			console.error(`Failed to resend invite ${inviteId}:`, error);
			throw error;
		}
	}

	/**
	 * Accept a space invitation
	 */
	async acceptInvite(inviteId: string, appToken: string): Promise<boolean> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.debug(`Accepting invite ${inviteId}`);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/invites/accept`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ inviteId }),
			});

			if (!response.ok) {
				let errorMessage = `Failed to accept invitation: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			return true;
		} catch (error) {
			console.error(`Failed to accept invite ${inviteId}:`, error);
			throw error;
		}
	}

	/**
	 * Decline a space invitation
	 */
	async declineInvite(inviteId: string, appToken: string): Promise<boolean> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.debug(`Declining invite ${inviteId}`);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/invites/decline`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ inviteId }),
			});

			if (!response.ok) {
				let errorMessage = `Failed to decline invitation: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			return true;
		} catch (error) {
			console.error(`Failed to decline invite ${inviteId}:`, error);
			throw error;
		}
	}

	/**
	 * Cancel a space invitation (for space owners/admins)
	 */
	async cancelInvite(inviteId: string, appToken: string): Promise<boolean> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.debug(`Canceling invite ${inviteId}`);

			const response = await fetch(`${this.apiUrl}/memoro/spaces/invites/cancel`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ inviteId }),
			});

			if (!response.ok) {
				let errorMessage = `Failed to cancel invitation: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			return true;
		} catch (error) {
			console.error(`Failed to cancel invite ${inviteId}:`, error);
			throw error;
		}
	}

	/**
	 * Get all invitations for the current user
	 */
	async getUserInvites(appToken: string): Promise<SpaceInvite[]> {
		try {
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			console.debug('Getting user invites');

			const response = await fetch(`${this.apiUrl}/memoro/invites/pending`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				let errorMessage = `Failed to get user invitations: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (jsonError) {
					// If we can't parse JSON, just use the status text
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('User invites:', data);
			return data.invites || [];
		} catch (error) {
			console.error('Failed to get user invites:', error);
			throw error;
		}
	}
}

// Export singleton instance
export const spaceService = new SpaceService();
