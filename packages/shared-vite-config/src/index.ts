/**
 * Shared Vite Configuration for Mana Web Apps
 * Provides consistent SSR and optimization settings.
 */

import { execSync } from 'child_process';
import type { UserConfig, UserConfigExport } from 'vite';

/**
 * Common Mana shared packages that need SSR configuration.
 * These packages contain Svelte 5 runes or other client-side state.
 */
export const MANA_SHARED_PACKAGES = [
	'@mana/shared-icons',
	'@mana/shared-ui',
	'@mana/shared-tailwind',
	'@mana/shared-theme',
	'@mana/shared-theme-ui',
	'@mana/shared-auth',
	'@mana/shared-auth-ui',
	'@mana/shared-branding',
	'@mana/shared-i18n',
	'@mana/shared-utils',
	'@mana/shared-tags',
	'@mana/shared-stores',
] as const;

/**
 * Get build-time defines for version tracking.
 * Injects __BUILD_HASH__ and __BUILD_TIME__ as compile-time constants.
 */
export function getBuildDefines(): Record<string, string> {
	let commitHash = 'dev';
	try {
		commitHash = execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		// fallback if not in a git repo
	}
	const buildTime = new Date().toISOString();
	return {
		__BUILD_HASH__: JSON.stringify(commitHash),
		__BUILD_TIME__: JSON.stringify(buildTime),
	};
}

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
 * Get the SSR noExternal configuration for Mana apps.
 */
export function getSsrNoExternal(additionalPackages: string[] = []): string[] {
	return [...MANA_SHARED_PACKAGES, ...additionalPackages];
}

/**
 * Get the optimizeDeps exclude configuration for Mana apps.
 */
export function getOptimizeDepsExclude(additionalExcludes: string[] = []): string[] {
	return [...MANA_SHARED_PACKAGES, ...additionalExcludes];
}

/**
 * Create a base Vite configuration for Mana SvelteKit apps.
 * Merge this with your app-specific configuration.
 */
export function createViteConfig(options: ViteConfigOptions): Partial<UserConfig> {
	const { port, additionalPackages = [], additionalExcludes = [] } = options;

	const packages = options.sharedPackages || [...MANA_SHARED_PACKAGES];
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
 * import { createViteConfig, mergeViteConfig } from '@mana/shared-vite-config';
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
): UserConfigExport {
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
