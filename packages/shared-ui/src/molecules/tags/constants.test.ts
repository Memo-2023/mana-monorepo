import { describe, it, expect } from 'vitest';
import { TAG_COLORS, DEFAULT_TAG_COLOR, getRandomTagColor, getTagColorByName } from './constants';

describe('TAG_COLORS', () => {
	it('contains 12 colors', () => {
		expect(TAG_COLORS).toHaveLength(12);
	});

	it('each color has name and hex', () => {
		for (const color of TAG_COLORS) {
			expect(color.name).toBeTruthy();
			expect(color.hex).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	it('has no duplicate names', () => {
		const names = TAG_COLORS.map((c) => c.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it('has no duplicate hex values', () => {
		const hexes = TAG_COLORS.map((c) => c.hex);
		expect(new Set(hexes).size).toBe(hexes.length);
	});
});

describe('DEFAULT_TAG_COLOR', () => {
	it('is blue (#3b82f6)', () => {
		expect(DEFAULT_TAG_COLOR).toBe('#3b82f6');
	});

	it('exists in the TAG_COLORS palette', () => {
		expect(TAG_COLORS.some((c) => c.hex === DEFAULT_TAG_COLOR)).toBe(true);
	});
});

describe('getRandomTagColor', () => {
	it('returns a hex color from the palette', () => {
		const validHexes = new Set(TAG_COLORS.map((c) => c.hex));
		for (let i = 0; i < 50; i++) {
			expect(validHexes.has(getRandomTagColor())).toBe(true);
		}
	});
});

describe('getTagColorByName', () => {
	it('returns correct hex for known names', () => {
		expect(getTagColorByName('red')).toBe('#ef4444');
		expect(getTagColorByName('blue')).toBe('#3b82f6');
		expect(getTagColorByName('green')).toBe('#22c55e');
	});

	it('returns default color for unknown names', () => {
		expect(getTagColorByName('nonexistent' as any)).toBe(DEFAULT_TAG_COLOR);
	});
});
