/**
 * Centralized tag constants and types for @manacore/shared-ui
 */

export const TAG_COLORS = [
	{ name: 'red', hex: '#ef4444' },
	{ name: 'orange', hex: '#f97316' },
	{ name: 'amber', hex: '#f59e0b' },
	{ name: 'lime', hex: '#84cc16' },
	{ name: 'green', hex: '#22c55e' },
	{ name: 'teal', hex: '#14b8a6' },
	{ name: 'cyan', hex: '#06b6d4' },
	{ name: 'blue', hex: '#3b82f6' },
	{ name: 'indigo', hex: '#6366f1' },
	{ name: 'violet', hex: '#8b5cf6' },
	{ name: 'pink', hex: '#ec4899' },
	{ name: 'slate', hex: '#64748b' },
] as const;

export const DEFAULT_TAG_COLOR = '#3b82f6'; // blue

export type TagColorName = (typeof TAG_COLORS)[number]['name'];
export type TagColorHex = (typeof TAG_COLORS)[number]['hex'];

export interface Tag {
	id: string;
	name: string;
	color?: string | null;
	style?: { color?: string };
}

export interface TagData {
	name?: string;
	text?: string;
	color?: string | null;
	style?: { color?: string };
}

/**
 * Get a random color from the palette
 */
export function getRandomTagColor(): string {
	return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)].hex;
}

/**
 * Get color by name
 */
export function getTagColorByName(name: TagColorName): string {
	for (const color of TAG_COLORS) {
		if (color.name === name) {
			return color.hex;
		}
	}
	return DEFAULT_TAG_COLOR;
}
