// @ts-check
/**
 * Root ESLint configuration for Manacore monorepo
 *
 * Uses @manacore/eslint-config for unified linting across all packages.
 * Apps can use their own eslint.config.* to add framework-specific rules.
 *
 * Config hierarchy:
 * 1. Root: base + typescript + prettier (this file)
 * 2. SvelteKit: adds svelteConfig
 * 3. Expo Mobile: adds reactConfig
 * 4. NestJS Backend: adds nestjsConfig
 */
import { baseConfig, typescriptConfig, prettierConfig } from '@manacore/eslint-config';

export default [
	// ============================================
	// Global ignores
	// ============================================
	{
		ignores: [
			// Build outputs
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/coverage/**',
			'**/.turbo/**',

			// Framework-specific
			'**/.svelte-kit/**',
			'**/.expo/**',
			'**/.next/**',

			// Archived projects
			'**/apps-archived/**',

			// Generated files
			'**/*.d.ts',
			'**/generated/**',

			// Config files (tool-specific, not part of app code)
			'**/drizzle.config.ts',
			'playwright.config.ts',
			'vitest.config.ts',
			'tests/**',

			// Documentation examples
			'docs/test-examples/**',

			// Games with specific runtime environments
			'games/whopixels/**',

			// Apps with their own ESLint configs (framework-specific)
			// These import from @manacore/eslint-config but add framework rules
			'apps/*/apps/mobile/**',
			'apps/*/apps/web/**',
			'apps/*/apps/backend/**',
			'apps/*/apps/landing/**',
			'apps/*/packages/**', // Project-specific packages
			'games/*/apps/**',
			'games/*/packages/**', // Game-specific packages
			'services/**',
		],
	},

	// ============================================
	// Base configuration for all files
	// ============================================
	...baseConfig,
	...typescriptConfig,
	...prettierConfig,
];
