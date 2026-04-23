/**
 * Theme resolver + CSS-var serializer tests.
 */

import { describe, it, expect } from 'vitest';
import {
	THEME_PRESETS,
	PRESET_LABELS,
	CLASSIC_LIGHT,
	MODERN_DARK,
	WARM,
	resolveTheme,
	themeCssVars,
	type ThemePreset,
} from './index';

describe('THEME_PRESETS', () => {
	it('has exactly classic / modern / warm', () => {
		expect(Object.keys(THEME_PRESETS).sort()).toEqual(['classic', 'modern', 'warm']);
	});

	it('exposes PRESET_LABELS for every preset', () => {
		for (const preset of Object.keys(THEME_PRESETS) as ThemePreset[]) {
			expect(PRESET_LABELS[preset]).toBeTruthy();
		}
	});

	it('each preset has all required tokens', () => {
		const required = [
			'primary',
			'primaryFg',
			'background',
			'foreground',
			'surface',
			'border',
			'muted',
			'fontFamily',
			'headingFontFamily',
			'radius',
		];
		for (const [name, tokens] of Object.entries(THEME_PRESETS)) {
			for (const key of required) {
				expect((tokens as Record<string, unknown>)[key], `${name}.${key}`).toBeTypeOf('string');
			}
		}
	});

	it('classic / modern / warm share the same set of keys (parity check)', () => {
		const keys = (o: object) => Object.keys(o).sort().join(',');
		expect(keys(CLASSIC_LIGHT)).toBe(keys(MODERN_DARK));
		expect(keys(CLASSIC_LIGHT)).toBe(keys(WARM));
	});
});

describe('resolveTheme', () => {
	it('returns preset tokens as-is when no overrides given', () => {
		const resolved = resolveTheme('classic');
		expect(resolved).toEqual(CLASSIC_LIGHT);
	});

	it('returns preset tokens when overrides is an empty object', () => {
		const resolved = resolveTheme('modern', {});
		expect(resolved).toEqual(MODERN_DARK);
	});

	it('overrides primary without touching the rest', () => {
		const resolved = resolveTheme('classic', { primary: '#ff0080' });
		expect(resolved.primary).toBe('#ff0080');
		expect(resolved.background).toBe(CLASSIC_LIGHT.background);
		expect(resolved.foreground).toBe(CLASSIC_LIGHT.foreground);
	});

	it('overrides multiple tokens simultaneously', () => {
		const resolved = resolveTheme('warm', {
			primary: '#111',
			background: '#222',
			foreground: '#333',
		});
		expect(resolved.primary).toBe('#111');
		expect(resolved.background).toBe('#222');
		expect(resolved.foreground).toBe('#333');
		expect(resolved.surface).toBe(WARM.surface); // untouched
	});
});

describe('themeCssVars', () => {
	it('serializes every token as a CSS custom property', () => {
		const css = themeCssVars(CLASSIC_LIGHT);
		expect(css).toContain('--wb-primary:');
		expect(css).toContain('--wb-primary-fg:');
		expect(css).toContain('--wb-bg:');
		expect(css).toContain('--wb-fg:');
		expect(css).toContain('--wb-surface:');
		expect(css).toContain('--wb-border:');
		expect(css).toContain('--wb-muted:');
		expect(css).toContain('--wb-font:');
		expect(css).toContain('--wb-font-heading:');
		expect(css).toContain('--wb-radius:');
	});

	it('substitutes the actual token values', () => {
		const css = themeCssVars(CLASSIC_LIGHT);
		expect(css).toContain(`--wb-primary:${CLASSIC_LIGHT.primary}`);
		expect(css).toContain(`--wb-bg:${CLASSIC_LIGHT.background}`);
	});

	it('falls back to body font for headings when headingFontFamily is empty', () => {
		const tokens = { ...CLASSIC_LIGHT, headingFontFamily: '' };
		const css = themeCssVars(tokens);
		expect(css).toContain(`--wb-font-heading:${CLASSIC_LIGHT.fontFamily}`);
	});

	it('separates declarations with semicolons (valid inline CSS)', () => {
		const css = themeCssVars(MODERN_DARK);
		// All 10 declarations → 9 semicolons between + 0 trailing.
		const semicolonCount = (css.match(/;/g) ?? []).length;
		expect(semicolonCount).toBe(9);
	});
});
