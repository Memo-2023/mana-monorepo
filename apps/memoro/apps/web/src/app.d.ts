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
			session: Session | null;
		}
	}
}

// Environment variables - SvelteKit exposes these via $env/static/public and $env/static/private
declare module '$env/static/public' {
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
	export const PUBLIC_MEMORO_MIDDLEWARE_URL: string;
	export const PUBLIC_MANA_MIDDLEWARE_URL: string;
	export const PUBLIC_MIDDLEWARE_APP_ID: string;
	export const PUBLIC_STORAGE_BUCKET: string;
	export const PUBLIC_GOOGLE_CLIENT_ID: string;
	export const PUBLIC_POSTHOG_KEY: string;
	export const PUBLIC_POSTHOG_HOST: string;
	export const PUBLIC_SENTRY_DSN: string;
}

declare module '$env/static/private' {
	export const SENTRY_AUTH_TOKEN: string;
}

export {};
