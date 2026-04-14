/**
 * App type declarations for Mana web app
 *
 * Authentication is handled entirely by Mana Core Auth (@mana/shared-auth).
 * No Supabase is needed - all data comes from mana-auth APIs.
 */

// Virtual modules provided by vite-plugin-pwa (wrapped by @vite-pwa/sveltekit):
//   - virtual:pwa-info            → pwaInfo.webManifest.linkTag for <svelte:head>
//   - virtual:pwa-register/svelte → useRegisterSW() Svelte-store hook
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/svelte" />

declare global {
	const __BUILD_HASH__: string;
	const __BUILD_TIME__: string;

	namespace App {
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface Locals {}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface PageData {}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
