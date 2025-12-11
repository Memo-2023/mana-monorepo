/**
 * Shared types for Manacore monorepo
 *
 * This package contains common TypeScript types used across all projects.
 */

// Theme types
export * from './theme';

// Auth types
export * from './auth';

// UI types
export * from './ui';

// Common utility types
export * from './common';

// Contact types for cross-app integration
export * from './contact';

// API types
export interface User {
	id: string;
	email: string;
	created_at: string;
	updated_at: string;
}

export interface ApiResponse<T> {
	data: T | null;
	error: ApiError | null;
}

export interface ApiError {
	message: string;
	code?: string;
	status?: number;
}

// Pagination types
export interface PaginationParams {
	page?: number;
	limit?: number;
	offset?: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
}

// Supabase common types
export interface SupabaseConfig {
	url: string;
	anonKey: string;
	serviceRoleKey?: string;
}
