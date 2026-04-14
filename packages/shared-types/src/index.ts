/**
 * Shared types for Mana monorepo
 *
 * This package contains common TypeScript types used across all projects.
 */

// Theme types
export * from './theme.ts';

// Auth types
export * from './auth.ts';

// UI types
export * from './ui.ts';

// Common utility types
export * from './common.ts';

// Contact types for cross-app integration
export * from './contact.ts';

// Landing page configuration types
export * from './landing-config.ts';

// AI structured-output Zod schemas (shared between mana-api + web frontend)
export * from './ai-schemas.ts';

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
