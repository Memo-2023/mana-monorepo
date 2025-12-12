/**
 * Split-Screen Types
 * Type definitions for the split-screen panel system.
 */

/**
 * Configuration for a panel showing an app in an iFrame.
 */
export interface PanelConfig {
	/** Unique identifier for the app (e.g., 'calendar', 'todo', 'contacts') */
	appId: string;
	/** Full URL to load in the iFrame */
	url: string;
	/** Display name for the app */
	name?: string;
}

/**
 * State of the split-screen system.
 */
export interface SplitScreenState {
	/** Whether split-screen mode is active */
	isActive: boolean;
	/** Configuration for the right panel (null when not in split mode) */
	rightPanel: PanelConfig | null;
	/** Position of the divider as percentage (20-80) */
	dividerPosition: number;
}

/**
 * App registration for the split-screen system.
 * Used to define which apps can be opened in panels.
 */
export interface AppDefinition {
	/** Unique app identifier */
	id: string;
	/** Display name */
	name: string;
	/** Base URL for the app */
	baseUrl: string;
	/** Icon name (Lucide icon) */
	icon?: string;
	/** App theme color */
	color?: string;
}

/**
 * Event payload for panel operations.
 */
export interface PanelEvent {
	type: 'open' | 'close' | 'swap' | 'resize';
	panel?: PanelConfig;
	dividerPosition?: number;
}

/**
 * Storage key configuration.
 */
export interface StorageConfig {
	/** Key prefix for localStorage */
	prefix: string;
	/** Current app ID for scoped storage */
	currentAppId: string;
}

/**
 * URL state parameters for split-screen.
 */
export interface UrlState {
	/** App ID for the right panel */
	panel?: string;
	/** Divider position percentage */
	split?: number;
}

/**
 * Minimum and maximum constraints for divider position.
 */
export const DIVIDER_CONSTRAINTS = {
	MIN: 20,
	MAX: 80,
	DEFAULT: 50,
} as const;

/**
 * Breakpoint for disabling split-screen on mobile.
 */
export const MOBILE_BREAKPOINT = 1024;
