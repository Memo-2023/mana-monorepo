/**
 * Supabase service-role client for Memoro server.
 *
 * Uses the service key to bypass RLS. All queries MUST explicitly
 * filter by `user_id` to enforce access control.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Returns a Supabase client using the service role key.
 * This bypasses Row Level Security — always filter by user_id explicitly.
 */
export function createServiceClient(): SupabaseClient {
	if (_client) return _client;

	const url = process.env.MEMORO_SUPABASE_URL;
	const key = process.env.MEMORO_SUPABASE_SERVICE_KEY;

	if (!url || !key) {
		throw new Error('MEMORO_SUPABASE_URL and MEMORO_SUPABASE_SERVICE_KEY must be set');
	}

	_client = createClient(url, key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	return _client;
}
