// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { DB } from '$lib/db';

// Supported locales
export type SupportedLocale = 'en' | 'de' | 'es' | 'fr' | 'it';

// User type (will be replaced by external auth later)
export interface User {
	id: string;
	email: string;
	username: string;
	name: string | null;
	avatarUrl: string | null;
	verified: boolean;
}

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: DB;
			user: User | null;
			locale: SupportedLocale;
		}
		interface PageData {
			user: User | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
