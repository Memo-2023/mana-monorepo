import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@mana/shared-pwa';
import { MANA_SHARED_PACKAGES, getBuildDefines } from '@mana/shared-vite-config';

/** App-specific shared packages used by migrated modules */
const APP_SHARED_PACKAGES = ['@zitare/content', '@calc/shared'];

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Mana',
				shortName: 'Mana',
				description: 'Mana App Ecosystem',
				themeColor: '#6366f1',
				registerType: 'prompt',
				preset: 'full',
				// Disable the service worker in dev. With devEnabled=true (the
				// default) vite-plugin-pwa registers a SW that aggressively
				// precaches the route chunks — and after the first dev session
				// the SW keeps serving the OLD JS even when Vite HMR pushes
				// new code, so source edits become invisible until the user
				// manually unregisters the worker in DevTools. The 2026-04-08
				// dreams mic-button bug took an extra hour to track down for
				// exactly this reason. Production still gets the full SW.
				devEnabled: false,
				shortcuts: [
					{ name: 'Dashboard', short_name: 'Home', url: '/', description: 'Zum Dashboard' },
					{
						name: 'Neue Aufgabe',
						short_name: 'Aufgabe',
						url: '/todo',
						description: 'Neue Aufgabe erstellen',
					},
					{
						name: 'Kalender',
						short_name: 'Kalender',
						url: '/calendar',
						description: 'Kalender öffnen',
					},
					{ name: 'Chat', short_name: 'Chat', url: '/chat', description: 'Chat öffnen' },
				],
			})
		),
	],
	server: {
		port: 5173,
		strictPort: true,
	},
	preview: {
		port: 4173,
		strictPort: true,
	},
	worker: {
		// Vite defaults to IIFE worker format, which does not support code
		// splitting. @mana/local-llm's worker imports transformers.js, which
		// is internally code-split into many chunks. Without 'es' format the
		// build fails with "Invalid value 'iife' for option 'worker.format'
		// - UMD and IIFE output formats are not supported for code-splitting
		// builds." All modern browsers (which we already require for WebGPU)
		// support module workers.
		format: 'es',
	},
	ssr: {
		// `rrule@2` ships dual CJS/ESM but its package.json has no `exports`
		// field, so the SvelteKit Node adapter resolves it to the CJS bundle
		// at runtime — and `import { RRule } from 'rrule'` then throws
		// `Named export 'RRule' not found` when /calendar SSRs. Bundling rrule
		// into the server build forces Vite's interop layer to handle the
		// CJS↔ESM mismatch correctly.
		noExternal: [...MANA_SHARED_PACKAGES, ...APP_SHARED_PACKAGES, 'rrule'],
		// transformers.js is browser-only (uses WebGPU + the Cache API). The
		// dynamic import in @mana/local-llm only ever fires client-side, but
		// SvelteKit's adapter-node Rollup pass would otherwise warn that the
		// import is unresolved at SSR time. Marking it external both silences
		// the warning and ensures the SSR bundle never tries to load it.
		external: ['@huggingface/transformers'],
	},
	optimizeDeps: {
		exclude: [...MANA_SHARED_PACKAGES, ...APP_SHARED_PACKAGES],
	},
	define: {
		...getBuildDefines(),
	},
	// Vitest unit-test config — keeps Playwright e2e specs out of the
	// vitest run. Without this exclude, vitest imports them and they
	// crash on `test.afterAll()` because they expect a Playwright runner.
	test: {
		exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', 'e2e/**', 'tests/e2e/**'],
	},
});
