// ─── Billing Rate ────────────────────────────────────────

export interface BillingRate {
	amount: number;
	currency: string;
	per: 'hour' | 'day';
}

// ─── Client ──────────────────────────────────────────────

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

// ─── Project ─────────────────────────────────────────────

export interface ProjectBudget {
	type: 'hours' | 'fixed';
	amount: number;
	currency?: string;
}

export type ProjectVisibility = 'private' | 'guild';

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

// ─── Time Entry ──────────────────────────────────────────

export type EntrySource = 'todo' | 'calendar' | 'manual' | 'timer';

export interface EntrySourceRef {
	app: EntrySource;
	refId?: string;
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

// ─── Tag ─────────────────────────────────────────────────

export interface Tag {
	id: string;
	name: string;
	color: string;
	order: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Template ────────────────────────────────────────────

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

// ─── Settings ────────────────────────────────────────────

export type RoundingMethod = 'none' | 'up' | 'down' | 'nearest';

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

// ─── View & Filter ───────────────────────────────────────

export type ViewMode = 'day' | 'week' | 'month';
export type SortField = 'date' | 'duration' | 'project' | 'client' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

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
