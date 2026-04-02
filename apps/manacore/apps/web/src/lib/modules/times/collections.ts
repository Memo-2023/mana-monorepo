/**
 * Times module — collection accessors and guest seed data.
 *
 * Tables are defined in the unified database.ts as:
 * timeClients, timeProjects, timeEntries, timeTags, timeTemplates, timeSettings
 */

import { db } from '$lib/data/database';
import type {
	LocalClient,
	LocalProject,
	LocalTimeEntry,
	LocalTag,
	LocalTemplate,
	LocalSettings,
	LocalAlarm,
	LocalCountdownTimer,
	LocalWorldClock,
} from './types';

// ─── Collection Accessors ──────────────────────────────────

export const clientTable = db.table<LocalClient>('timeClients');
export const projectTable = db.table<LocalProject>('timeProjects');
export const timeEntryTable = db.table<LocalTimeEntry>('timeEntries');
export const tagTable = db.table<LocalTag>('timeTags');
export const templateTable = db.table<LocalTemplate>('timeTemplates');
export const settingsTable = db.table<LocalSettings>('timeSettings');

// Clock collections (merged from clock module)
export const alarmTable = db.table<LocalAlarm>('timeAlarms');
export const countdownTimerTable = db.table<LocalCountdownTimer>('timeCountdownTimers');
export const worldClockTable = db.table<LocalWorldClock>('timeWorldClocks');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_CLIENT_ID = 'demo-client-acme';
const DEMO_PROJECT_ID = 'demo-project-redesign';
const DEMO_INTERNAL_PROJECT_ID = 'demo-project-internal';

function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return d.toISOString().split('T')[0];
}

export const TIMES_GUEST_SEED = {
	timeClients: [
		{
			id: DEMO_CLIENT_ID,
			name: 'Acme Corp',
			shortCode: 'ACME',
			email: 'kontakt@acme.de',
			color: '#3b82f6',
			isArchived: false,
			billingRate: { amount: 95, currency: 'EUR', per: 'hour' as const },
			order: 0,
		},
		{
			id: 'demo-client-startup',
			name: 'TechStartup GmbH',
			shortCode: 'TS',
			color: '#8b5cf6',
			isArchived: false,
			billingRate: { amount: 85, currency: 'EUR', per: 'hour' as const },
			order: 1,
		},
	],
	timeProjects: [
		{
			id: DEMO_PROJECT_ID,
			clientId: DEMO_CLIENT_ID,
			name: 'Website Redesign',
			description: 'Kompletter Relaunch der Unternehmenswebsite',
			color: '#3b82f6',
			isArchived: false,
			isBillable: true,
			billingRate: { amount: 95, currency: 'EUR', per: 'hour' as const },
			budget: { type: 'hours' as const, amount: 120 },
			visibility: 'private' as const,
			order: 0,
		},
		{
			id: DEMO_INTERNAL_PROJECT_ID,
			name: 'Intern / Meetings',
			description: 'Interne Meetings, Orga, Admin',
			color: '#6b7280',
			isArchived: false,
			isBillable: false,
			visibility: 'private' as const,
			order: 1,
		},
		{
			id: 'demo-project-app',
			clientId: 'demo-client-startup',
			name: 'Mobile App',
			description: 'React Native App Entwicklung',
			color: '#8b5cf6',
			isArchived: false,
			isBillable: true,
			budget: { type: 'hours' as const, amount: 200 },
			visibility: 'private' as const,
			order: 2,
		},
	],
	timeEntries: [
		{
			id: 'times-entry-1',
			projectId: DEMO_PROJECT_ID,
			clientId: DEMO_CLIENT_ID,
			description: 'Homepage Layout erstellen',
			date: todayStr(),
			startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
			endTime: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
			duration: 9000,
			isBillable: true,
			isRunning: false,
			tags: ['design'],
			visibility: 'private' as const,
			source: { app: 'manual' as const },
		},
		{
			id: 'times-entry-2',
			projectId: DEMO_INTERNAL_PROJECT_ID,
			description: 'Sprint Planning',
			date: todayStr(),
			startTime: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
			endTime: new Date(new Date().setHours(12, 15, 0, 0)).toISOString(),
			duration: 2700,
			isBillable: false,
			isRunning: false,
			tags: ['meeting'],
			visibility: 'private' as const,
			source: { app: 'manual' as const },
		},
		{
			id: 'times-entry-3',
			projectId: DEMO_PROJECT_ID,
			clientId: DEMO_CLIENT_ID,
			description: 'API Integration',
			date: todayStr(),
			startTime: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
			endTime: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
			duration: 7200,
			isBillable: true,
			isRunning: false,
			tags: ['development'],
			visibility: 'private' as const,
			source: { app: 'timer' as const },
		},
		{
			id: 'times-entry-4',
			projectId: 'demo-project-app',
			clientId: 'demo-client-startup',
			description: 'Login Screen implementieren',
			date: yesterdayStr(),
			startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
			endTime: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
			duration: 10800,
			isBillable: true,
			isRunning: false,
			tags: ['development'],
			visibility: 'private' as const,
			source: { app: 'timer' as const },
		},
		{
			id: 'times-entry-5',
			projectId: DEMO_PROJECT_ID,
			clientId: DEMO_CLIENT_ID,
			description: 'Code Review & Testing',
			date: yesterdayStr(),
			duration: 5400,
			isBillable: true,
			isRunning: false,
			tags: ['review'],
			visibility: 'private' as const,
			source: { app: 'manual' as const },
		},
	],
	timeTags: [
		{ id: 'times-tag-design', name: 'design', color: '#f59e0b', order: 0 },
		{ id: 'times-tag-dev', name: 'development', color: '#3b82f6', order: 1 },
		{ id: 'times-tag-meeting', name: 'meeting', color: '#6b7280', order: 2 },
		{ id: 'times-tag-review', name: 'review', color: '#22c55e', order: 3 },
	],
	timeSettings: [
		{
			id: 'times-default-settings',
			workingHoursPerDay: 8,
			workingDaysPerWeek: 5,
			roundingIncrement: 0,
			roundingMethod: 'none' as const,
			defaultVisibility: 'private' as const,
			weekStartsOn: 1 as const,
			timerReminderMinutes: 0,
			autoStopTimerHours: 0,
		},
	],
	// Clock guest seed (merged from clock module)
	timeAlarms: [
		{
			id: 'alarm-weekday-morning',
			label: 'Wecker Wochentags',
			time: '07:00',
			enabled: true,
			repeatDays: [1, 2, 3, 4, 5], // Mon-Fri
			snoozeMinutes: 5,
			sound: null,
			vibrate: true,
		},
	] satisfies LocalAlarm[],
	timeWorldClocks: [
		{
			id: 'wc-new-york',
			timezone: 'America/New_York',
			cityName: 'New York',
			sortOrder: 0,
		},
		{
			id: 'wc-tokyo',
			timezone: 'Asia/Tokyo',
			cityName: 'Tokio',
			sortOrder: 1,
		},
	] satisfies LocalWorldClock[],
};
