/**
 * Times module types for the unified app.
 *
 * Mirrors @times/shared types but uses BaseRecord for local-first storage.
 */

import type { BaseRecord } from '@mana/local-store';

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
	field: string;
	direction: 'asc' | 'desc';
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
	timeBlockId: string;
	projectId?: string;
	clientId?: string;
	description: string;
	// Time fields from TimeBlock (denormalized for convenience in pure helpers)
	date: string; // YYYY-MM-DD derived from timeBlock.startDate
	startTime?: string; // from timeBlock.startDate
	endTime?: string; // from timeBlock.endDate
	isRunning: boolean; // from timeBlock.isLive
	duration: number;
	isBillable: boolean;
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
	timeBlockId: string;
	projectId?: string | null;
	clientId?: string | null;
	description: string;
	duration: number; // billable/rounded seconds (authoritative for billing)
	isBillable: boolean;
	tags: string[];
	billingRate?: BillingRate | null;
	visibility: ProjectVisibility;
	guildId?: string | null;
	source?: EntrySourceRef | null;
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

// ─── Clock Types (merged from clock module) ─────────────

export interface LocalAlarm extends BaseRecord {
	label: string | null;
	time: string; // HH:mm format
	enabled: boolean;
	repeatDays: number[] | null; // [0-6] where 0 = Sunday
	snoozeMinutes: number | null;
	sound: string | null;
	vibrate: boolean | null;
}

export interface LocalCountdownTimer extends BaseRecord {
	label: string | null;
	durationSeconds: number;
	remainingSeconds: number | null;
	status: 'idle' | 'running' | 'paused' | 'finished';
	startedAt: string | null;
	pausedAt: string | null;
	sound: string | null;
}

export interface LocalWorldClock extends BaseRecord {
	timezone: string; // IANA timezone e.g. 'America/New_York'
	cityName: string;
	sortOrder: number;
}

// ─── API-Level Clock Types (inlined from archived @clock/shared) ───

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface Alarm {
	id: string;
	label: string | null;
	time: string; // HH:MM:SS format
	enabled: boolean;
	repeatDays: number[] | null; // [0-6] where 0 = Sunday
	snoozeMinutes: number | null;
	sound: string | null;
	vibrate: boolean | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateAlarmInput {
	label?: string;
	time: string;
	enabled?: boolean;
	repeatDays?: number[];
	snoozeMinutes?: number;
	sound?: string;
	vibrate?: boolean;
}

export interface UpdateAlarmInput {
	label?: string;
	time?: string;
	enabled?: boolean;
	repeatDays?: number[];
	snoozeMinutes?: number;
	sound?: string;
	vibrate?: boolean;
}

export interface Timer {
	id: string;
	label: string | null;
	durationSeconds: number;
	remainingSeconds: number | null;
	status: TimerStatus;
	startedAt: string | null;
	pausedAt: string | null;
	sound: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTimerInput {
	label?: string;
	durationSeconds: number;
	sound?: string;
}

export interface UpdateTimerInput {
	label?: string;
	durationSeconds?: number;
	sound?: string;
}

export interface WorldClock {
	id: string;
	timezone: string; // IANA timezone e.g. 'America/New_York'
	cityName: string;
	sortOrder: number;
	createdAt: string;
}

export interface CreateWorldClockInput {
	timezone: string;
	cityName: string;
}

// ─── Clock Constants (inlined from archived @clock/shared) ───

export const POPULAR_TIMEZONES = [
	{
		timezone: 'America/New_York',
		city: 'New York',
		region: 'Americas',
		lat: 40.7128,
		lng: -74.006,
	},
	{
		timezone: 'America/Los_Angeles',
		city: 'Los Angeles',
		region: 'Americas',
		lat: 34.0522,
		lng: -118.2437,
	},
	{ timezone: 'America/Chicago', city: 'Chicago', region: 'Americas', lat: 41.8781, lng: -87.6298 },
	{ timezone: 'America/Toronto', city: 'Toronto', region: 'Americas', lat: 43.6532, lng: -79.3832 },
	{
		timezone: 'America/Sao_Paulo',
		city: 'São Paulo',
		region: 'Americas',
		lat: -23.5505,
		lng: -46.6333,
	},
	{
		timezone: 'America/Mexico_City',
		city: 'Mexico City',
		region: 'Americas',
		lat: 19.4326,
		lng: -99.1332,
	},
	{
		timezone: 'America/Buenos_Aires',
		city: 'Buenos Aires',
		region: 'Americas',
		lat: -34.6037,
		lng: -58.3816,
	},
	{
		timezone: 'America/Vancouver',
		city: 'Vancouver',
		region: 'Americas',
		lat: 49.2827,
		lng: -123.1207,
	},
	{ timezone: 'Europe/London', city: 'London', region: 'Europe', lat: 51.5074, lng: -0.1278 },
	{ timezone: 'Europe/Paris', city: 'Paris', region: 'Europe', lat: 48.8566, lng: 2.3522 },
	{ timezone: 'Europe/Berlin', city: 'Berlin', region: 'Europe', lat: 52.52, lng: 13.405 },
	{ timezone: 'Europe/Rome', city: 'Rome', region: 'Europe', lat: 41.9028, lng: 12.4964 },
	{ timezone: 'Europe/Madrid', city: 'Madrid', region: 'Europe', lat: 40.4168, lng: -3.7038 },
	{ timezone: 'Europe/Amsterdam', city: 'Amsterdam', region: 'Europe', lat: 52.3676, lng: 4.9041 },
	{ timezone: 'Europe/Vienna', city: 'Vienna', region: 'Europe', lat: 48.2082, lng: 16.3738 },
	{ timezone: 'Europe/Zurich', city: 'Zurich', region: 'Europe', lat: 47.3769, lng: 8.5417 },
	{ timezone: 'Europe/Moscow', city: 'Moscow', region: 'Europe', lat: 55.7558, lng: 37.6173 },
	{ timezone: 'Europe/Stockholm', city: 'Stockholm', region: 'Europe', lat: 59.3293, lng: 18.0686 },
	{ timezone: 'Europe/Istanbul', city: 'Istanbul', region: 'Europe', lat: 41.0082, lng: 28.9784 },
	{ timezone: 'Asia/Tokyo', city: 'Tokyo', region: 'Asia', lat: 35.6762, lng: 139.6503 },
	{ timezone: 'Asia/Shanghai', city: 'Shanghai', region: 'Asia', lat: 31.2304, lng: 121.4737 },
	{ timezone: 'Asia/Hong_Kong', city: 'Hong Kong', region: 'Asia', lat: 22.3193, lng: 114.1694 },
	{ timezone: 'Asia/Singapore', city: 'Singapore', region: 'Asia', lat: 1.3521, lng: 103.8198 },
	{ timezone: 'Asia/Seoul', city: 'Seoul', region: 'Asia', lat: 37.5665, lng: 126.978 },
	{ timezone: 'Asia/Mumbai', city: 'Mumbai', region: 'Asia', lat: 19.076, lng: 72.8777 },
	{ timezone: 'Asia/Dubai', city: 'Dubai', region: 'Asia', lat: 25.2048, lng: 55.2708 },
	{ timezone: 'Asia/Bangkok', city: 'Bangkok', region: 'Asia', lat: 13.7563, lng: 100.5018 },
	{ timezone: 'Asia/Jakarta', city: 'Jakarta', region: 'Asia', lat: -6.2088, lng: 106.8456 },
	{ timezone: 'Australia/Sydney', city: 'Sydney', region: 'Oceania', lat: -33.8688, lng: 151.2093 },
	{
		timezone: 'Australia/Melbourne',
		city: 'Melbourne',
		region: 'Oceania',
		lat: -37.8136,
		lng: 144.9631,
	},
	{
		timezone: 'Pacific/Auckland',
		city: 'Auckland',
		region: 'Oceania',
		lat: -36.8485,
		lng: 174.7633,
	},
	{ timezone: 'Africa/Cairo', city: 'Cairo', region: 'Africa', lat: 30.0444, lng: 31.2357 },
	{
		timezone: 'Africa/Johannesburg',
		city: 'Johannesburg',
		region: 'Africa',
		lat: -26.2041,
		lng: 28.0473,
	},
	{ timezone: 'Africa/Lagos', city: 'Lagos', region: 'Africa', lat: 6.5244, lng: 3.3792 },
] as const;

export const ALARM_SOUNDS = [
	{ id: 'default', name: 'Default', nameDE: 'Standard' },
	{ id: 'gentle', name: 'Gentle', nameDE: 'Sanft' },
	{ id: 'classic', name: 'Classic', nameDE: 'Klassisch' },
	{ id: 'digital', name: 'Digital', nameDE: 'Digital' },
	{ id: 'nature', name: 'Nature', nameDE: 'Natur' },
	{ id: 'chime', name: 'Chime', nameDE: 'Glockenspiel' },
] as const;

export const DEFAULT_ALARM_PRESETS = [
	{ time: '06:00', label: 'Früh aufstehen', labelEN: 'Wake up early' },
	{ time: '07:00', label: 'Aufwachen', labelEN: 'Wake up' },
	{ time: '08:00', label: 'Morgen', labelEN: 'Morning' },
	{ time: '12:00', label: 'Mittag', labelEN: 'Noon' },
	{ time: '18:00', label: 'Feierabend', labelEN: 'End of work' },
	{ time: '22:00', label: 'Schlafenszeit', labelEN: 'Bedtime' },
] as const;

// ─── Times Constants ─────────────────────────────────────────

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
