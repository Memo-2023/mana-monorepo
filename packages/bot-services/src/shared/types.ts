/**
 * Common types used across all bot services
 */

// Base entity interface
export interface BaseEntity {
	id: string;
	createdAt: string;
	updatedAt?: string;
}

// User-scoped entity
export interface UserEntity extends BaseEntity {
	userId: string;
}

// Storage provider interface - allows swapping file/db storage
export interface StorageProvider<T> {
	load(): Promise<T>;
	save(data: T): Promise<void>;
}

// Service configuration
export interface ServiceConfig {
	storagePath?: string;
	apiUrl?: string;
	timeout?: number;
}

// Result type for operations
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Pagination
export interface PaginationOptions {
	limit?: number;
	offset?: number;
}

export interface PaginatedResult<T> {
	items: T[];
	total: number;
	limit: number;
	offset: number;
}

// Date range filter
export interface DateRange {
	start: Date;
	end: Date;
}

// Priority levels
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export const PRIORITY_VALUES: Record<Priority, number> = {
	urgent: 1,
	high: 2,
	medium: 3,
	low: 4,
};

// Common stats interface
export interface ServiceStats {
	total: number;
	active: number;
	completed?: number;
}
