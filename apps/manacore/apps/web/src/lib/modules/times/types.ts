/**
 * Times module types for the unified app.
 *
 * Mirrors @times/shared types but uses BaseRecord for local-first storage.
 */

import type { BaseRecord } from '@manacore/local-store';

// ─── Shared Types (inlined from @times/shared) ────────────

export interface BillingRate {
	amount: number;
	currency: string;
	per: 'hour' | 'day';
}

export type ProjectVisibility = 'private' | 'guild';
export type EntrySource = 'todo' | 'calendar' | 'manual' | 'timer';
export type RoundingMethod = 'none' | 'up' | 'down' | 'nearest';
export type ViewMode = 'day' | 'week' | 'month';
export type SortField = 'date' | 'duration' | 'project' | 'client' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface EntrySourceRef {
	app: EntrySource;
	refId?: string;
}

export interface ProjectBudget {
	type: 'hours' | 'fixed';
	amount: number;
	currency?: string;
}

export interface SortOption {
	field: SortField;
	direction: SortDirection;
}

export interface FilterCriteria {
	search?: string;
	projectId?: string;
	clientId?: string;
	tagIds?: string[];
	isBillable?: boolean;
	dateFrom?: string;
	dateTo?: string;
}

export interface SavedFilter {
	id: string;
	name: string;
	criteria: FilterCriteria;
	createdAt: string;
}

// ─── Domain Types ─────────────────────────────────────────

export interface Client {
	id: string;
	name: string;
	shortCode?: string;
	contactId?: string;
	email?: string;
	color: string;
	isArchived: boolean;
	billingRate?: BillingRate;
	notes?: string;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface Project {
	id: string;
	clientId?: string;
	name: string;
	description?: string;
	color: string;
	isArchived: boolean;
	isBillable: boolean;
	billingRate?: BillingRate;
	budget?: ProjectBudget;
	visibility: ProjectVisibility;
	guildId?: string;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface TimeEntry {
	id: string;
	projectId?: string;
	clientId?: string;
	description: string;
	date: string;
	startTime?: string;
	endTime?: string;
	duration: number;
	isBillable: boolean;
	isRunning: boolean;
	tags: string[];
	billingRate?: BillingRate;
	visibility: ProjectVisibility;
	guildId?: string;
	source?: EntrySourceRef;
	createdAt: string;
	updatedAt: string;
}

export interface Tag {
	id: string;
	name: string;
	color: string;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface EntryTemplate {
	id: string;
	name: string;
	projectId?: string;
	clientId?: string;
	description: string;
	isBillable: boolean;
	tags: string[];
	usageCount: number;
	lastUsedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface TimesSettings {
	id: string;
	defaultBillingRate?: BillingRate;
	workingHoursPerDay: number;
	workingDaysPerWeek: number;
	roundingIncrement: number;
	roundingMethod: RoundingMethod;
	defaultVisibility: ProjectVisibility;
	weekStartsOn: 0 | 1;
	timerReminderMinutes: number;
	autoStopTimerHours: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalClient extends BaseRecord {
	name: string;
	shortCode?: string | null;
	contactId?: string | null;
	email?: string | null;
	color: string;
	isArchived: boolean;
	billingRate?: BillingRate | null;
	notes?: string | null;
	order: number;
}

export interface LocalProject extends BaseRecord {
	clientId?: string | null;
	name: string;
	description?: string | null;
	color: string;
	isArchived: boolean;
	isBillable: boolean;
	billingRate?: BillingRate | null;
	budget?: {
		type: 'hours' | 'fixed';
		amount: number;
		currency?: string;
	} | null;
	visibility: ProjectVisibility;
	guildId?: string | null;
	order: number;
}

export interface LocalTimeEntry extends BaseRecord {
	projectId?: string | null;
	clientId?: string | null;
	description: string;
	date: string;
	startTime?: string | null;
	endTime?: string | null;
	duration: number;
	isBillable: boolean;
	isRunning: boolean;
	tags: string[];
	billingRate?: BillingRate | null;
	visibility: ProjectVisibility;
	guildId?: string | null;
	source?: EntrySourceRef | null;
}

export interface LocalTag extends BaseRecord {
	name: string;
	color: string;
	order: number;
}

export interface LocalTemplate extends BaseRecord {
	name: string;
	projectId?: string | null;
	clientId?: string | null;
	description: string;
	isBillable: boolean;
	tags: string[];
	usageCount: number;
	lastUsedAt?: string | null;
}

export interface LocalSettings extends BaseRecord {
	defaultBillingRate?: BillingRate | null;
	workingHoursPerDay: number;
	workingDaysPerWeek: number;
	roundingIncrement: number;
	roundingMethod: 'none' | 'up' | 'down' | 'nearest';
	defaultVisibility: ProjectVisibility;
	weekStartsOn: 0 | 1;
	timerReminderMinutes: number;
	autoStopTimerHours: number;
}

// ─── Constants ────────────────────────────────────────────

export const PROJECT_COLORS: string[] = [
	'#ef4444',
	'#f97316',
	'#f59e0b',
	'#eab308',
	'#84cc16',
	'#22c55e',
	'#14b8a6',
	'#06b6d4',
	'#0ea5e9',
	'#3b82f6',
	'#6366f1',
	'#8b5cf6',
	'#a855f7',
	'#d946ef',
	'#ec4899',
	'#f43f5e',
];
