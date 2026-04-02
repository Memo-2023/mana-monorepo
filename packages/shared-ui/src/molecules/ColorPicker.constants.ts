/**
 * Standard color palettes for use with ColorPicker.
 */

/** 12-color palette (same as TAG_COLORS) — good for tags, labels, categories */
export const COLORS_12 = [
	'#ef4444',
	'#f97316',
	'#f59e0b',
	'#84cc16',
	'#22c55e',
	'#14b8a6',
	'#06b6d4',
	'#3b82f6',
	'#6366f1',
	'#8b5cf6',
	'#ec4899',
	'#64748b',
] as const;

/** 16-color extended palette — good for projects, clients, folders */
export const COLORS_16 = [
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
] as const;

/** Default color (blue) */
export const DEFAULT_COLOR = '#3b82f6';

/** Get a random color from the 12-color palette */
export function getRandomColor(): string {
	return COLORS_12[Math.floor(Math.random() * COLORS_12.length)];
}
