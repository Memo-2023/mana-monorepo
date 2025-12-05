/**
 * Shared Vite Configuration for ManaCore Web Apps
 * Provides consistent SSR and optimization settings.
 */

import type { UserConfig } from 'vite';

/**
 * Common ManaCore shared packages that need SSR configuration.
 * These packages contain Svelte 5 runes or other client-side state.
 */
export const MANACORE_SHARED_PACKAGES = [
	'@manacore/shared-icons',
	'@manacore/shared-ui',
	'@manacore/shared-tailwind',
	'@manacore/shared-theme',
	'@manacore/shared-theme-ui',
	'@manacore/shared-feedback-ui',
	'@manacore/shared-feedback-service',
	'@manacore/shared-feedback-types',
	'@manacore/shared-auth',
	'@manacore/shared-auth-ui',
	'@manacore/shared-branding',
	'@manacore/shared-subscription-ui',
	'@manacore/shared-profile-ui',
	'@manacore/shared-i18n',
	'@manacore/shared-api-client',
] as const;

export interface ViteConfigOptions {
	/** Server port */
	port: number;
	/** Additional packages to include in noExternal (e.g., app-specific shared packages) */
	additionalPackages?: string[];
	/** Additional packages to exclude from optimization */
	additionalExcludes?: string[];
	/** Override default shared packages (if you need a subset) */
	sharedPackages?: string[];
}

/**
 * Get the SSR noExternal configuration for ManaCore apps.
 */
export function getSsrNoExternal(additionalPackages: string[] = []): string[] {
	return [...MANACORE_SHARED_PACKAGES, ...additionalPackages];
}

/**
 * Get the optimizeDeps exclude configuration for ManaCore apps.
 */
export function getOptimizeDepsExclude(additionalExcludes: string[] = []): string[] {
	return [...MANACORE_SHARED_PACKAGES, ...additionalExcludes];
}

/**
 * Create a base Vite configuration for ManaCore SvelteKit apps.
 * Merge this with your app-specific configuration.
 */
export function createViteConfig(options: ViteConfigOptions): Partial<UserConfig> {
	const { port, additionalPackages = [], additionalExcludes = [] } = options;

	const packages = options.sharedPackages || [...MANACORE_SHARED_PACKAGES];
	const noExternal = [...packages, ...additionalPackages];
	const exclude = [...packages, ...additionalExcludes];

	return {
		server: {
			port,
			strictPort: true,
		},
		ssr: {
			noExternal,
		},
		optimizeDeps: {
			exclude,
		},
	};
}

/**
 * Merge base config with app-specific plugins and settings.
 * Use this in your vite.config.ts:
 *
 * @example
 * ```ts
 * import { sveltekit } from '@sveltejs/kit/vite';
 * import tailwindcss from '@tailwindcss/vite';
 * import { defineConfig } from 'vite';
 * import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';
 *
 * const baseConfig = createViteConfig({
 *   port: 5174,
 *   additionalPackages: ['@chat/shared'],
 * });
 *
 * export default defineConfig(mergeViteConfig(baseConfig, {
 *   plugins: [tailwindcss(), sveltekit()],
 * }));
 * ```
 */
export function mergeViteConfig(
	baseConfig: Partial<UserConfig>,
	appConfig: Partial<UserConfig>
): UserConfig {
	return {
		...baseConfig,
		...appConfig,
		server: {
			...baseConfig.server,
			...appConfig.server,
		},
		ssr: {
			...baseConfig.ssr,
			...appConfig.ssr,
			noExternal: [
				...((baseConfig.ssr?.noExternal as string[]) || []),
				...((appConfig.ssr?.noExternal as string[]) || []),
			],
		},
		optimizeDeps: {
			...baseConfig.optimizeDeps,
			...appConfig.optimizeDeps,
			exclude: [
				...(baseConfig.optimizeDeps?.exclude || []),
				...(appConfig.optimizeDeps?.exclude || []),
			],
		},
		plugins: [...(baseConfig.plugins || []), ...(appConfig.plugins || [])],
	};
}
