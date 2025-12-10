// Default project colors
export const DEFAULT_PROJECT_COLORS = [
	'#3B82F6', // Blue
	'#EF4444', // Red
	'#10B981', // Green
	'#F59E0B', // Amber
	'#8B5CF6', // Violet
	'#EC4899', // Pink
	'#06B6D4', // Cyan
	'#F97316', // Orange
] as const;

// Default label colors
export const DEFAULT_LABEL_COLORS = [
	'#6B7280', // Gray
	'#EF4444', // Red
	'#F59E0B', // Amber
	'#10B981', // Green
	'#3B82F6', // Blue
	'#8B5CF6', // Violet
	'#EC4899', // Pink
	'#14B8A6', // Teal
] as const;

// Priority configuration
export const PRIORITY_CONFIG = {
	low: {
		label: 'Low',
		color: '#6B7280',
		order: 0,
	},
	medium: {
		label: 'Medium',
		color: '#3B82F6',
		order: 1,
	},
	high: {
		label: 'High',
		color: '#F59E0B',
		order: 2,
	},
	urgent: {
		label: 'Urgent',
		color: '#EF4444',
		order: 3,
	},
} as const;

// Recurrence presets
export const RECURRENCE_PRESETS = [
	{ label: 'Daily', rule: 'FREQ=DAILY' },
	{ label: 'Weekdays', rule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
	{ label: 'Weekly', rule: 'FREQ=WEEKLY' },
	{ label: 'Bi-weekly', rule: 'FREQ=WEEKLY;INTERVAL=2' },
	{ label: 'Monthly', rule: 'FREQ=MONTHLY' },
	{ label: 'Yearly', rule: 'FREQ=YEARLY' },
] as const;

// Reminder presets (in minutes)
export const REMINDER_PRESETS = [
	{ label: 'At time of task', minutes: 0 },
	{ label: '5 minutes before', minutes: 5 },
	{ label: '15 minutes before', minutes: 15 },
	{ label: '30 minutes before', minutes: 30 },
	{ label: '1 hour before', minutes: 60 },
	{ label: '2 hours before', minutes: 120 },
	{ label: '1 day before', minutes: 1440 },
	{ label: '2 days before', minutes: 2880 },
	{ label: '1 week before', minutes: 10080 },
] as const;

// Re-export task-specific constants (German localized versions)
export * from './task';

// View types
export type ViewType =
	| 'inbox'
	| 'today'
	| 'upcoming'
	| 'project'
	| 'label'
	| 'completed'
	| 'search';

// Sort options
export const SORT_OPTIONS = [
	{ value: 'order', label: 'Manual' },
	{ value: 'dueDate', label: 'Due Date' },
	{ value: 'priority', label: 'Priority' },
	{ value: 'createdAt', label: 'Created' },
] as const;
