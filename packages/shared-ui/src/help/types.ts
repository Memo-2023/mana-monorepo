import type { Component } from 'svelte';

/**
 * Represents a single keyboard shortcut
 */
export interface KeyboardShortcut {
	/** Keys to press, e.g. ['Cmd', 'Enter'] or ['↑', '↓'] */
	keys: string[];
	/** Description of what the shortcut does */
	description: string;
	/** Category ID for grouping */
	category: string;
	/** Alternative keys (e.g. Ctrl instead of Cmd) */
	altKeys?: string[];
}

/**
 * A category/group of related shortcuts
 */
export interface ShortcutCategory {
	/** Unique identifier */
	id: string;
	/** Display title */
	title: string;
	/** Optional icon component */
	icon?: Component;
	/** Shortcuts in this category */
	shortcuts: KeyboardShortcut[];
}

/**
 * Color variants for syntax highlighting
 */
export type SyntaxColor = 'primary' | 'success' | 'accent' | 'error' | 'warning' | 'warning-soft';

/**
 * A syntax example - can be a simple string or an object with label
 */
export type SyntaxExample =
	| string
	| {
			text: string;
			label?: string;
			color?: SyntaxColor;
	  };

/**
 * A syntax pattern that can be used in the InputBar
 */
export interface SyntaxPattern {
	/** The pattern syntax, e.g. '#tag', '@name', 'Datum' */
	pattern: string;
	/** Description of what the pattern does */
	description: string;
	/** Example usages */
	examples: SyntaxExample[];
	/** Color for highlighting */
	color: SyntaxColor;
	/** Optional icon component */
	icon?: Component;
}

/**
 * A group of related syntax patterns
 */
export interface SyntaxGroup {
	/** Group title */
	title: string;
	/** Patterns in this group */
	items: SyntaxPattern[];
}

/**
 * Configuration for the HelpModal
 */
export interface HelpModalConfig {
	/** Shortcut categories to display */
	shortcuts?: ShortcutCategory[];
	/** Syntax groups to display */
	syntax?: SyntaxGroup[];
	/** Whether to show tabs (auto-detected if both shortcuts and syntax are provided) */
	showTabs?: boolean;
	/** Default tab to show */
	defaultTab?: 'shortcuts' | 'syntax';
	/** Live example text for syntax highlighting demo */
	liveExample?: {
		text: string;
		highlights: Array<{
			type: 'text' | 'tag' | 'reference' | 'date' | 'time' | 'priority';
			content: string;
		}>;
	};
}
