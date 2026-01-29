import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserConfig } from 'vite';

// ManaCore shared packages that need SSR configuration
const MANACORE_SHARED_PACKAGES = [
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
	'@manacore/shared-splitscreen',
	'@manacore/shared-utils',
	'@manacore/shared-tags',
	'@manacore/shared-help-types',
	'@manacore/shared-help-content',
	'@manacore/shared-help-ui',
];

const noExternal = [...MANACORE_SHARED_PACKAGES, '@matrix/shared'];
const exclude = [...MANACORE_SHARED_PACKAGES];

const baseConfig: Partial<UserConfig> = {
	server: {
		port: 5180,
		strictPort: true,
	},
	ssr: {
		noExternal,
	},
	optimizeDeps: {
		exclude,
	},
};

export default defineConfig({
	...baseConfig,
	plugins: [tailwindcss(), sveltekit()],
	server: {
		...baseConfig.server,
		headers: {
			// Required for WASM module loading
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
	ssr: {
		...baseConfig.ssr,
	},
	define: {
		global: 'globalThis',
	},
	optimizeDeps: {
		...baseConfig.optimizeDeps,
		include: ['buffer', 'events'],
		// WASM modules cannot be pre-bundled
		exclude: [...exclude, '@matrix-org/matrix-sdk-crypto-wasm'],
		esbuildOptions: {
			define: {
				global: 'globalThis',
			},
		},
	},
	worker: {
		format: 'es',
	},
	build: {
		target: 'esnext',
	},
});
