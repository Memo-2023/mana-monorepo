/**
 * Theme presets for the website builder.
 *
 * A preset is a named set of CSS variables (`--wb-primary`, `--wb-bg`,
 * `--wb-fg`, plus spacing/type tokens). The public renderer injects
 * these via inline `style` on the root — block components read them
 * through `var()` so they inherit the theme without hardcoding.
 *
 * Users pick a preset and can override individual colors via
 * `site.theme.overrides`.
 */

import type { ThemePreset } from './types';

export interface ThemeTokens {
	/** Primary brand color — buttons, links, accents. */
	primary: string;
	/** Primary color's contrast text (white on most primaries). */
	primaryFg: string;
	/** Page background. */
	background: string;
	/** Page text color. */
	foreground: string;
	/** Subtle surface (section bg, hero subtle). */
	surface: string;
	/** Border / divider color (dividers, card outlines). */
	border: string;
	/** Muted text (captions, metadata). */
	muted: string;
	/** Font family for headings + body. */
	fontFamily: string;
	/** Font family for headings if different. Empty = same as body. */
	headingFontFamily: string;
	/** Base radius for buttons + cards. */
	radius: string;
}

export const CLASSIC_LIGHT: ThemeTokens = {
	primary: '#3b82f6',
	primaryFg: '#ffffff',
	background: '#ffffff',
	foreground: '#0f172a',
	surface: '#f8fafc',
	border: 'rgba(15, 23, 42, 0.08)',
	muted: 'rgba(15, 23, 42, 0.6)',
	fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
	headingFontFamily: '',
	radius: '0.5rem',
};

export const MODERN_DARK: ThemeTokens = {
	primary: '#6366f1',
	primaryFg: '#ffffff',
	background: '#0b0d12',
	foreground: '#f5f6f8',
	surface: 'rgba(255, 255, 255, 0.04)',
	border: 'rgba(255, 255, 255, 0.08)',
	muted: 'rgba(255, 255, 255, 0.6)',
	fontFamily: 'ui-sans-serif, system-ui, sans-serif',
	headingFontFamily: 'ui-sans-serif, system-ui, sans-serif',
	radius: '0.75rem',
};

export const WARM: ThemeTokens = {
	primary: '#f97316',
	primaryFg: '#ffffff',
	background: '#fdf6ed',
	foreground: '#3b2d1f',
	surface: '#f7ede2',
	border: 'rgba(59, 45, 31, 0.12)',
	muted: 'rgba(59, 45, 31, 0.6)',
	fontFamily: '"Merriweather", Georgia, serif',
	headingFontFamily: '"Merriweather", Georgia, serif',
	radius: '0.375rem',
};

export const THEME_PRESETS: Record<ThemePreset, ThemeTokens> = {
	classic: CLASSIC_LIGHT,
	modern: MODERN_DARK,
	warm: WARM,
};

export const PRESET_LABELS: Record<ThemePreset, string> = {
	classic: 'Klassisch (hell)',
	modern: 'Modern (dunkel)',
	warm: 'Warm (Serif)',
};

/**
 * Merge preset tokens with per-site overrides.
 */
export function resolveTheme(
	preset: ThemePreset,
	overrides?: Partial<Pick<ThemeTokens, 'primary' | 'background' | 'foreground'>>
): ThemeTokens {
	const base = THEME_PRESETS[preset];
	return { ...base, ...(overrides ?? {}) };
}

/**
 * Serialise tokens as a CSS-variable string for inline `style=`.
 */
export function themeCssVars(tokens: ThemeTokens): string {
	return [
		`--wb-primary:${tokens.primary}`,
		`--wb-primary-fg:${tokens.primaryFg}`,
		`--wb-bg:${tokens.background}`,
		`--wb-fg:${tokens.foreground}`,
		`--wb-surface:${tokens.surface}`,
		`--wb-border:${tokens.border}`,
		`--wb-muted:${tokens.muted}`,
		`--wb-font:${tokens.fontFamily}`,
		`--wb-font-heading:${tokens.headingFontFamily || tokens.fontFamily}`,
		`--wb-radius:${tokens.radius}`,
	].join(';');
}

export type { ThemePreset };
