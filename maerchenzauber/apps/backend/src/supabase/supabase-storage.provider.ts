import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { RequestContextService } from '../common/services/request-context.service';

/**
 * Supabase Storage Provider using Continuation Local Storage
 *
 * This provider creates Supabase clients for storage operations on-demand
 * using the JWT token from the current request context.
 */
@Injectable()
export class SupabaseStorageProvider {
  private readonly url: string;
  private readonly anonKey: string;
  private readonly serviceRoleKey: string | undefined;
  private defaultClient: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly contextService: RequestContextService,
  ) {
    this.url = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_URL')!;
    this.anonKey = this.configService.get<string>(
      'MAERCHENZAUBER_SUPABASE_ANON_KEY',
    )!;
    this.serviceRoleKey = this.configService.get<string>(
      'MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY',
    );

    // Create a default client with anon key
    this.defaultClient = createClient(this.url, this.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('=== SupabaseStorageProvider Initialized (Singleton) ===');
    }
  }

  getClient(): SupabaseClient {
    // Get token from current request context
    const token = this.contextService.getToken();

    if (process.env.NODE_ENV === 'development') {
      console.log('=== SupabaseStorageProvider getClient ===');
      console.log('Has token:', !!token);
      console.log('Request ID:', this.contextService.getRequestId());
    }

    if (token) {
      // Use the user's token from Mana - it's already a Supabase JWT
      if (process.env.NODE_ENV === 'development') {
        console.log('SupabaseStorageProvider: Using user token');
        console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
      }

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
    } else if (this.serviceRoleKey && this.serviceRoleKey.startsWith('eyJ')) {
      // Fallback to service role key if available
      if (process.env.NODE_ENV === 'development') {
        console.log('SupabaseStorageProvider: Using service role key');
      }
      return createClient(this.url, this.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      // Return default client with anon key
      if (process.env.NODE_ENV === 'development') {
        console.log('SupabaseStorageProvider: Using default client (anon key)');
      }
      return this.defaultClient;
    }
  }
}
