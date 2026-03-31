import type { TaskPriority } from '@todo/shared';

/**
 * Hex color for each priority level, used for inline styles (e.g. checkbox tint).
 */
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
	low: '#22c55e',
	medium: '#eab308',
	high: '#f97316',
	urgent: '#ef4444',
};

/**
 * Tailwind background-color class for each priority level,
 * used for dot indicators and filter pill backgrounds.
 */
export const PRIORITY_BG_CLASSES: Record<TaskPriority, string> = {
	low: 'bg-blue-500',
	medium: 'bg-yellow-500',
	high: 'bg-orange-500',
	urgent: 'bg-red-500',
};

/**
 * Full priority option descriptors for filter UIs.
 */
export const PRIORITY_OPTIONS: {
	value: TaskPriority;
	label: string;
	color: string;
	bgColor: string;
}[] = [
	{ value: 'urgent', label: 'Dringend', color: '#ef4444', bgColor: 'bg-red-500' },
	{ value: 'high', label: 'Hoch', color: '#f97316', bgColor: 'bg-orange-500' },
	{ value: 'medium', label: 'Normal', color: '#eab308', bgColor: 'bg-yellow-500' },
	{ value: 'low', label: 'Niedrig', color: '#3b82f6', bgColor: 'bg-blue-500' },
];
