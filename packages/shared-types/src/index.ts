/**
 * Shared types for Mana monorepo
 *
 * This package contains common TypeScript types used across all projects.
 */

// Re-exports carry explicit `.ts` extensions. Previously they were
// extension-less to stay happy with bundler-mode tsconfigs, but
// tooling that runs Node's ESM loader over this file (e.g. Tailwind
// v4's module resolver when it follows imports out of @source-scanned
// packages like shared-branding) needs extensions to resolve relative
// paths. All downstream tsconfigs use `moduleResolution: "bundler"`
// which accepts `.ts` suffixes without `allowImportingTsExtensions`.
export * from './theme.ts';
export * from './auth.ts';
export * from './ui.ts';
export * from './common.ts';
export * from './contact.ts';
export * from './landing-config.ts';
export * from './ai-schemas.ts';
export * from './spaces.ts';

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
