import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			// Session helpers - returns mock session while transitioning to Mana Core Auth
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			getSession: () => Promise<Session | null>;
		}
		// interface PageData {}
		// interface Error {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
