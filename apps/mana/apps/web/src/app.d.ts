declare const __BUILD_HASH__: string;
declare const __BUILD_TIME__: string;

/**
 * App type declarations for Mana web app
 *
 * Authentication is handled entirely by Mana Core Auth (@mana/shared-auth).
 * No Supabase is needed - all data comes from mana-auth APIs.
 */
declare global {
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
