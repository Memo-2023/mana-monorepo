/**
 * Guest seed data for the Taktik app.
 *
 * Provides demo clients, projects, and time entries for the guest experience.
 */

import type {
	LocalClient,
	LocalProject,
	LocalTimeEntry,
	LocalTag,
	LocalSettings,
} from './local-store';

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

export const guestClients: LocalClient[] = [
	{
		id: DEMO_CLIENT_ID,
		name: 'Acme Corp',
		shortCode: 'ACME',
		email: 'kontakt@acme.de',
		color: '#3b82f6',
		isArchived: false,
		billingRate: { amount: 95, currency: 'EUR', per: 'hour' },
		order: 0,
	},
	{
		id: 'demo-client-startup',
		name: 'TechStartup GmbH',
		shortCode: 'TS',
		color: '#8b5cf6',
		isArchived: false,
		billingRate: { amount: 85, currency: 'EUR', per: 'hour' },
		order: 1,
	},
];

export const guestProjects: LocalProject[] = [
	{
		id: DEMO_PROJECT_ID,
		clientId: DEMO_CLIENT_ID,
		name: 'Website Redesign',
		description: 'Kompletter Relaunch der Unternehmenswebsite',
		color: '#3b82f6',
		isArchived: false,
		isBillable: true,
		billingRate: { amount: 95, currency: 'EUR', per: 'hour' },
		budget: { type: 'hours', amount: 120 },
		visibility: 'private',
		order: 0,
	},
	{
		id: DEMO_INTERNAL_PROJECT_ID,
		name: 'Intern / Meetings',
		description: 'Interne Meetings, Orga, Admin',
		color: '#6b7280',
		isArchived: false,
		isBillable: false,
		visibility: 'private',
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
		budget: { type: 'hours', amount: 200 },
		visibility: 'private',
		order: 2,
	},
];

export const guestTimeEntries: LocalTimeEntry[] = [
	{
		id: 'entry-1',
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
		visibility: 'private',
		source: { app: 'manual' },
	},
	{
		id: 'entry-2',
		projectId: DEMO_INTERNAL_PROJECT_ID,
		description: 'Sprint Planning',
		date: todayStr(),
		startTime: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
		endTime: new Date(new Date().setHours(12, 15, 0, 0)).toISOString(),
		duration: 2700,
		isBillable: false,
		isRunning: false,
		tags: ['meeting'],
		visibility: 'private',
		source: { app: 'manual' },
	},
	{
		id: 'entry-3',
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
		visibility: 'private',
		source: { app: 'timer' },
	},
	{
		id: 'entry-4',
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
		visibility: 'private',
		source: { app: 'timer' },
	},
	{
		id: 'entry-5',
		projectId: DEMO_PROJECT_ID,
		clientId: DEMO_CLIENT_ID,
		description: 'Code Review & Testing',
		date: yesterdayStr(),
		duration: 5400,
		isBillable: true,
		isRunning: false,
		tags: ['review'],
		visibility: 'private',
		source: { app: 'manual' },
	},
];

export const guestTags: LocalTag[] = [
	{ id: 'tag-design', name: 'design', color: '#f59e0b', order: 0 },
	{ id: 'tag-dev', name: 'development', color: '#3b82f6', order: 1 },
	{ id: 'tag-meeting', name: 'meeting', color: '#6b7280', order: 2 },
	{ id: 'tag-review', name: 'review', color: '#22c55e', order: 3 },
];

export const guestSettings: LocalSettings[] = [
	{
		id: 'default-settings',
		workingHoursPerDay: 8,
		workingDaysPerWeek: 5,
		roundingIncrement: 0,
		roundingMethod: 'none',
		defaultVisibility: 'private',
		weekStartsOn: 1,
		timerReminderMinutes: 0,
		autoStopTimerHours: 0,
	},
];
