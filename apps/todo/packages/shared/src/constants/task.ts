import type { TaskPriority, TaskStatus } from '../types/task';

export interface PriorityOption {
	value: TaskPriority;
	label: string;
	color: string;
}

export interface StatusOption {
	value: TaskStatus;
	label: string;
}

export interface RecurrenceOption {
	value: string;
	label: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
	{ value: 'low', label: 'Später', color: '#22c55e' },
	{ value: 'medium', label: 'Normal', color: '#eab308' },
	{ value: 'high', label: 'Wichtig', color: '#f97316' },
	{ value: 'urgent', label: 'Dringend', color: '#ef4444' },
];

export const STATUS_OPTIONS: StatusOption[] = [
	{ value: 'pending', label: 'Offen' },
	{ value: 'in_progress', label: 'In Arbeit' },
	{ value: 'completed', label: 'Erledigt' },
	{ value: 'cancelled', label: 'Abgebrochen' },
];

export const RECURRENCE_OPTIONS: RecurrenceOption[] = [
	{ value: '', label: 'Keine Wiederholung' },
	{ value: 'FREQ=DAILY', label: 'Täglich' },
	{ value: 'FREQ=WEEKLY', label: 'Wöchentlich' },
	{ value: 'FREQ=WEEKLY;INTERVAL=2', label: 'Alle 2 Wochen' },
	{ value: 'FREQ=MONTHLY', label: 'Monatlich' },
	{ value: 'FREQ=YEARLY', label: 'Jährlich' },
];

// Fibonacci sequence for story points
export const STORYPOINT_OPTIONS = [1, 2, 3, 5, 8, 13, 21] as const;

// Helper to get priority label
export function getPriorityLabel(priority: TaskPriority): string {
	const option = PRIORITY_OPTIONS.find((p) => p.value === priority);
	return option?.label ?? priority;
}

// Helper to get status label
export function getStatusLabel(status: TaskStatus): string {
	const option = STATUS_OPTIONS.find((s) => s.value === status);
	return option?.label ?? status;
}
