import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

/**
 * Service that creates authenticated Supabase clients
 * This is a singleton service that creates clients on-demand with tokens
 */
@Injectable()
export class SupabaseClientService {
	private readonly url: string;
	private readonly anonKey: string;

	constructor(private configService: ConfigService) {
		this.url = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_URL')!;
		this.anonKey = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_ANON_KEY')!;
	}

	/**
	 * Create an authenticated Supabase client with the given token
	 */
	createAuthenticatedClient(token: string): SupabaseClient {
		return createClient(this.url, this.anonKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
			global: {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		});
	}

	/**
	 * Create an unauthenticated Supabase client
	 */
	createUnauthenticatedClient(): SupabaseClient {
		return createClient(this.url, this.anonKey);
	}
}
