import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { RequestContextService } from '../common/services/request-context.service';

@Injectable()
export class SupabaseProvider {
	private readonly url: string;
	private readonly anonKey: string;
	private readonly serviceRoleKey: string;
	private clientCache: Map<string, SupabaseClient> = new Map();
	private adminClient: SupabaseClient | null = null;

	constructor(
		private configService: ConfigService,
		private requestContextService: RequestContextService
	) {
		this.url = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_URL')!;
		this.anonKey = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_ANON_KEY')!;
		this.serviceRoleKey = this.configService.get<string>(
			'MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY'
		)!;
	}

	getClient(): SupabaseClient {
		const token = this.requestContextService.getToken();

		// Use token as cache key, or 'anon' for unauthenticated requests
		const cacheKey = token || 'anon';

		// Check if we already have a client for this token
		if (this.clientCache.has(cacheKey)) {
			return this.clientCache.get(cacheKey)!;
		}

		console.log('SupabaseProvider - creating client, has token:', !!token);

		let client: SupabaseClient;

		if (token) {
			// The token from mana-core should work directly with Supabase
			// It's already signed with the correct JWT secret
			client = createClient(this.url, this.anonKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
					detectSessionInUrl: false,
				},
				global: {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			});

			// Cache for this request only (clear cache periodically in production)
			this.clientCache.set(cacheKey, client);

			// Auto-clear cache after 5 minutes to prevent memory leaks
			setTimeout(
				() => {
					this.clientCache.delete(cacheKey);
				},
				5 * 60 * 1000
			);
		} else {
			// Create default client with anon key
			client = createClient(this.url, this.anonKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
					detectSessionInUrl: false,
				},
			});

			// Cache the anon client permanently
			this.clientCache.set('anon', client);
		}

		return client;
	}

	/**
	 * Get admin client with service role key (bypasses RLS)
	 * Use for server-side operations that need full database access
	 */
	getAdminClient(): SupabaseClient {
		if (!this.adminClient) {
			this.adminClient = createClient(this.url, this.serviceRoleKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
					detectSessionInUrl: false,
				},
			});
		}
		return this.adminClient;
	}

	clearCache(): void {
		// Clear all cached clients except anon
		for (const [key] of this.clientCache) {
			if (key !== 'anon') {
				this.clientCache.delete(key);
			}
		}
	}
}
