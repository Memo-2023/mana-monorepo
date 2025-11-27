/**
 * Central color definitions for the app
 * These colors are also defined in tailwind.config.js for Tailwind classes
 * Use these constants for native components that need hex values
 */

export const Colors = {
	dark: {
		// Base colors
		background: '#000000', // Main app background - pure black
		surface: '#242424', // Cards, containers, modals
		elevated: '#2a2a2a', // Elevated surfaces (tooltips, dropdowns)
		border: '#383838', // Borders and dividers
		input: '#1f1f1f', // Input field backgrounds

		// Text colors
		text: {
			primary: '#f3f4f6', // Main text (gray-100)
			secondary: '#d1d5db', // Secondary text (gray-300)
			tertiary: '#9ca3af', // Tertiary text (gray-400)
			disabled: '#6b7280', // Disabled text (gray-500)
		},

		// Brand colors
		primary: {
			default: '#818cf8', // Primary brand color (indigo-400)
			hover: '#a5b4fc', // Hover state (indigo-300)
			active: '#6366f1', // Active state (indigo-500)
		},

		// Status colors
		danger: '#ef4444', // Error, delete actions (red-500)
		success: '#10b981', // Success states (emerald-500)
		warning: '#f59e0b', // Warning states (amber-500)
	},

	// Light mode colors (for future use)
	light: {
		background: '#ffffff',
		surface: '#f9fafb',
		elevated: '#ffffff',
		border: '#e5e7eb',
		input: '#ffffff',
	},
};

// Tab bar specific colors (for native components)
export const TabBarColors = {
	background: Colors.dark.surface, // Changed to match QuickGenerateBar
	borderTop: Colors.dark.border,
	activeIcon: Colors.dark.primary.default,
	inactiveIcon: Colors.dark.text.disabled,
};
