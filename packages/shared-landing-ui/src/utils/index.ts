/**
 * Utility functions for shared landing UI components
 */

/**
 * CSS custom properties that should be defined in your project's CSS
 * for the shared components to work correctly.
 */
export const requiredCssVariables = [
	'--color-primary',
	'--color-primary-hover',
	'--color-primary-glow',
	'--color-text-primary',
	'--color-text-secondary',
	'--color-text-muted',
	'--color-background-page',
	'--color-background-card',
	'--color-background-card-hover',
	'--color-border',
	'--color-border-hover',
] as const;

/**
 * Example CSS variable definitions for light theme
 */
export const exampleLightTheme = `
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-glow: rgba(59, 130, 246, 0.3);
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-muted: #9ca3af;
  --color-background-page: #ffffff;
  --color-background-card: #f9fafb;
  --color-background-card-hover: #f3f4f6;
  --color-border: #e5e7eb;
  --color-border-hover: #d1d5db;
}
`;

/**
 * Example CSS variable definitions for dark theme
 */
export const exampleDarkTheme = `
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #60a5fa;
  --color-primary-glow: rgba(59, 130, 246, 0.3);
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-text-muted: #6b7280;
  --color-background-page: #111827;
  --color-background-card: #1f2937;
  --color-background-card-hover: #374151;
  --color-border: #374151;
  --color-border-hover: #4b5563;
}
`;

/**
 * Type definitions for component props (for TypeScript users)
 */
export interface ButtonProps {
	href?: string;
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	fullWidth?: boolean;
}

export interface CardProps {
	variant?: 'default' | 'hover' | 'glow' | 'bordered';
	padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface Feature {
	icon: string;
	title: string;
	description: string;
	href?: string;
}

export interface Testimonial {
	name: string;
	role?: string;
	company?: string;
	text: string;
	image?: string;
	rating?: number;
}

export interface FAQItem {
	question: string;
	answer: string;
}

export interface PricingPlan {
	name: string;
	description?: string;
	price: string;
	period?: string;
	features: Array<{ text: string; included: boolean } | string>;
	cta: { text: string; href: string };
	highlighted?: boolean;
	badge?: string;
}
