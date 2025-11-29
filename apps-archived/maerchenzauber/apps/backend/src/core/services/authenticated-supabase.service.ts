import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { RequestContextService } from '../../common/services/request-context.service';

/**
 * Authenticated Supabase Service using Continuation Local Storage
 *
 * This service provides authenticated Supabase clients that properly handle
 * the request context and token without requiring request-scoped providers.
 */
@Injectable()
export class AuthenticatedSupabaseService {
	private readonly url: string;
	private readonly anonKey: string;
	private defaultClient: SupabaseClient;

	constructor(
		private readonly configService: ConfigService,
		private readonly contextService: RequestContextService
	) {
		this.url = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_URL')!;
		this.anonKey = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_ANON_KEY')!;

		// Create a default unauthenticated client
		this.defaultClient = createClient(this.url, this.anonKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});

		if (process.env.NODE_ENV === 'development') {
			console.log('=== AuthenticatedSupabaseService Initialized (Singleton) ===');
		}
	}

	getClient(): SupabaseClient {
		// Get token from current request context
		const token = this.contextService.getToken();

		if (process.env.NODE_ENV === 'development') {
			console.log('=== AuthenticatedSupabaseService getClient ===');
			console.log('Has context:', this.contextService.hasContext());
			console.log('Has token:', !!token);
			console.log('Request ID:', this.contextService.getRequestId());
		}

		if (token) {
			if (process.env.NODE_ENV === 'development') {
				console.log('Creating authenticated Supabase client');
				console.log('Token first 20 chars:', token.substring(0, 20) + '...');
			}

			// Create an authenticated client for this request
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
		} else {
			if (process.env.NODE_ENV === 'development') {
				console.log('Creating UNAUTHENTICATED Supabase client (no token found)');
			}
			// Return default unauthenticated client
			return this.defaultClient;
		}
	}

	/**
	 * Get an authenticated client with a specific token
	 * @param token JWT token to use for authentication
	 * @returns SupabaseClient configured with the provided token
	 */
	getClientWithToken(token: string): SupabaseClient {
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
}
