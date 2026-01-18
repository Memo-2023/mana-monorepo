/**
 * App type declarations for ManaCore web app
 *
 * Authentication is handled entirely by Mana Core Auth (@manacore/shared-auth).
 * No Supabase is needed - all data comes from mana-core-auth APIs.
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
