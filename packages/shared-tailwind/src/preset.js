/**
 * Shared Tailwind CSS preset for all Mana apps
 *
 * This preset uses HSL-based CSS variables for theming.
 * Colors are defined as HSL values (e.g., "47 95% 58%") and
 * wrapped with hsl() in the Tailwind config for flexibility.
 *
 * Usage in tailwind.config.js:
 * ```
 * import preset from '@mana/shared-tailwind/preset';
 *
 * export default {
 *   presets: [preset],
 *   content: ['./src/**\/*.{html,js,svelte,ts}'],
 *   // app-specific overrides...
 * }
 * ```
 */

/** @type {import('tailwindcss').Config} */
const preset = {
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Brand color (consistent across all apps)
				mana: '#4287f5',

				// ===== HSL-Based Semantic Colors =====
				// These use CSS variables set by @mana/shared-theme
				// Format: hsl(var(--color-name)) where --color-name is "H S% L%"

				// Page background
				background: 'hsl(var(--color-background))',

				// Main text color
				foreground: 'hsl(var(--color-foreground))',

				// Primary brand color (customizable per app)
				primary: {
					DEFAULT: 'hsl(var(--color-primary))',
					foreground: 'hsl(var(--color-primary-foreground))',
				},

				// Secondary accent
				secondary: {
					DEFAULT: 'hsl(var(--color-secondary))',
					foreground: 'hsl(var(--color-secondary-foreground))',
				},

				// Card/content surfaces
				surface: {
					DEFAULT: 'hsl(var(--color-surface))',
					hover: 'hsl(var(--color-surface-hover))',
					elevated: 'hsl(var(--color-surface-elevated))',
				},

				// Muted/disabled elements
				muted: {
					DEFAULT: 'hsl(var(--color-muted))',
					foreground: 'hsl(var(--color-muted-foreground))',
				},

				// Borders
				border: {
					DEFAULT: 'hsl(var(--color-border))',
					strong: 'hsl(var(--color-border-strong))',
				},

				// Semantic/feedback colors
				error: 'hsl(var(--color-error))',
				success: 'hsl(var(--color-success))',
				warning: 'hsl(var(--color-warning))',

				// Form elements
				input: 'hsl(var(--color-input))',
				ring: 'hsl(var(--color-ring))',

				// ===== Legacy aliases (for backwards compatibility) =====
				content: {
					DEFAULT: 'hsl(var(--color-surface))',
					hover: 'hsl(var(--color-surface-hover))',
					page: 'hsl(var(--color-background))',
				},
				menu: {
					DEFAULT: 'hsl(var(--color-muted))',
					hover: 'hsl(var(--color-surface-hover))',
				},
				theme: {
					DEFAULT: 'hsl(var(--color-foreground))',
					secondary: 'hsl(var(--color-muted-foreground))',
				},
				'primary-btn': {
					DEFAULT: 'hsl(var(--color-primary))',
					text: 'hsl(var(--color-primary-foreground))',
				},
			},

			// Border radius tokens (CSS variable support)
			borderRadius: {
				none: '0',
				sm: 'var(--radius-sm, 0.25rem)',
				DEFAULT: 'var(--radius, 0.375rem)',
				md: 'var(--radius-md, 0.5rem)',
				lg: 'var(--radius-lg, 0.75rem)',
				xl: 'var(--radius-xl, 1rem)',
				'2xl': 'var(--radius-2xl, 1.5rem)',
				'3xl': 'var(--radius-3xl, 2rem)',
				full: '9999px',
			},

			// Box shadow tokens
			boxShadow: {
				sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
				lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
				xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
				'2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
				inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
				none: 'none',
			},

			// Font family
			fontFamily: {
				sans: [
					'Inter',
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'Arial',
					'sans-serif',
				],
				mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
			},

			// Animation
			animation: {
				'spin-slow': 'spin 3s linear infinite',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'bounce-slow': 'bounce 2s infinite',
				'fade-in': 'fadeIn 0.2s ease-out',
				'fade-out': 'fadeOut 0.2s ease-in',
				'slide-in': 'slideIn 0.2s ease-out',
				'slide-out': 'slideOut 0.2s ease-in',
			},

			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				fadeOut: {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				slideIn: {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				slideOut: {
					'0%': { transform: 'translateY(0)', opacity: '1' },
					'100%': { transform: 'translateY(-10px)', opacity: '0' },
				},
			},

			// Transition
			transitionDuration: {
				250: '250ms',
				350: '350ms',
				400: '400ms',
			},
		},
	},
	plugins: [],
};

export default preset;
