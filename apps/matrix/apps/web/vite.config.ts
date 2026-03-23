import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

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
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			srcDir: 'src',
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			scope: '/',
			base: '/',
			manifest: {
				name: 'Manalink',
				short_name: 'Manalink',
				description: 'Secure Matrix messaging client',
				theme_color: '#8b5cf6',
				background_color: '#09090b',
				display: 'standalone',
				orientation: 'portrait',
				start_url: '/',
				scope: '/',
				categories: ['communication', 'social'],
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
				shortcuts: [
					{
						name: 'New Chat',
						short_name: 'New Chat',
						url: '/chat?action=new',
						icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
					},
				],
			},
			injectManifest: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: true,
				// Cache strategies
				runtimeCaching: [
					{
						// Cache Matrix API responses (short TTL)
						urlPattern: /^https:\/\/matrix\.mana\.how\/_matrix\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'matrix-api-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 5, // 5 minutes
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						// Cache images and avatars
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'image-cache',
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
						},
					},
					{
						// Cache fonts
						urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'font-cache',
							expiration: {
								maxEntries: 20,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
						},
					},
				],
			},
			devOptions: {
				enabled: process.env.NODE_ENV !== 'production',
				type: 'module',
				navigateFallback: '/',
			},
			kit: {
				includeVersionFile: true,
			},
		}),
	],
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
