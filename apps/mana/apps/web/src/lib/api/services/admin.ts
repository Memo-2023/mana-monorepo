/**
 * Admin API Service
 *
 * Provides admin functionality for managing user data across all projects.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

// Get Auth API URL dynamically at runtime (admin endpoints are on auth service)
function getAuthApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
			.__PUBLIC_MANA_AUTH_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	return 'http://localhost:3001/api/v1';
}

// Lazy-initialized client
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getAuthApiUrl());
	}
	return _client;
}

/**
 * User list item from admin API
 */
export interface UserListItem {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: string;
	lastActiveAt?: string;
}

/**
 * User list response with pagination
 */
export interface UserListResponse {
	users: UserListItem[];
	total: number;
	page: number;
	limit: number;
}

/**
 * Entity count for a project
 */
export interface EntityCount {
	entity: string;
	count: number;
	label: string;
}

/**
 * Project data summary
 */
export interface ProjectDataSummary {
	projectId: string;
	projectName: string;
	icon: string;
	available: boolean;
	error?: string;
	entities: EntityCount[];
	totalCount: number;
	lastActivityAt?: string;
}

/**
 * User info
 */
export interface UserInfo {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: string;
	emailVerified: boolean;
}

/**
 * Auth data summary
 */
export interface AuthDataSummary {
	sessionsCount: number;
	accountsCount: number;
	has2FA: boolean;
	lastLoginAt: string | null;
}

/**
 * Credits data summary
 */
export interface CreditsDataSummary {
	balance: number;
	totalEarned: number;
	totalSpent: number;
	transactionsCount: number;
}

/**
 * Full user data summary
 */
export interface UserDataSummary {
	user: UserInfo;
	auth: AuthDataSummary;
	credits: CreditsDataSummary;
	projects: ProjectDataSummary[];
	totals: {
		totalEntities: number;
		projectsWithData: number;
	};
}

/**
 * Delete result for a project
 */
export interface ProjectDeleteResult {
	projectId: string;
	projectName: string;
	success: boolean;
	deletedCount?: number;
	error?: string;
}

/**
 * Full delete response
 */
export interface DeleteUserDataResponse {
	success: boolean;
	deletedFromProjects: ProjectDeleteResult[];
	deletedFromAuth: {
		sessions: number;
		accounts: number;
		credits: number;
		user: boolean;
	};
	totalDeleted: number;
}

/**
 * Admin service for user data management
 */
export const adminService = {
	/**
	 * Get list of users with pagination and search
	 */
	async getUsers(
		page: number = 1,
		limit: number = 20,
		search?: string
	): Promise<ApiResult<UserListResponse>> {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
		});
		if (search) {
			params.set('search', search);
		}

		return getClient().get<UserListResponse>(`/admin/users?${params.toString()}`);
	},

	/**
	 * Get aggregated user data from all projects
	 */
	async getUserData(userId: string): Promise<ApiResult<UserDataSummary>> {
		return getClient().get<UserDataSummary>(`/admin/users/${userId}/data`);
	},

	/**
	 * Delete all user data (GDPR right to be forgotten)
	 */
	async deleteUserData(userId: string): Promise<ApiResult<DeleteUserDataResponse>> {
		return getClient().delete<DeleteUserDataResponse>(`/admin/users/${userId}/data`);
	},
};
