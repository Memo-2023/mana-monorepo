/**
 * App type declarations for ManaCore web app
 *
 * Authentication is handled entirely by Mana Core Auth (@manacore/shared-auth).
 * No Supabase is needed - all data comes from mana-core-auth APIs.
 */
import type { UserData } from '@manacore/shared-auth';

declare global {
	namespace App {
		interface Locals {
			session?: {
				access_token: string;
				user: UserData;
			} | null;
		}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface PageData {}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
