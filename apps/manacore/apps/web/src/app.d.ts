import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			// Auth is handled by Mana Core Auth (@manacore/shared-auth), not Supabase
			// Supabase is used for database operations only
			supabase?: SupabaseClient;
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
