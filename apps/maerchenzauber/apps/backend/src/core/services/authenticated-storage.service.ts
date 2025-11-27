import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthenticatedStorageService {
	private readonly logger = new Logger(AuthenticatedStorageService.name);
	private supabaseClient: SupabaseClient;

	constructor(private configService: ConfigService) {
		const url = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_URL');
		const anonKey = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_ANON_KEY');

		if (!url || !anonKey) {
			throw new Error('Supabase configuration is missing');
		}

		this.supabaseClient = createClient(url, anonKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});
	}

	/**
	 * Upload a file to Supabase storage with proper authentication context
	 * This method sets the user context before uploading to ensure RLS policies work
	 */
	async uploadWithAuthentication(
		token: string,
		bucket: string,
		path: string,
		file: Buffer | Blob | File,
		options?: {
			contentType?: string;
			upsert?: boolean;
		}
	): Promise<{ data: any; error: any }> {
		try {
			// First, authenticate the custom JWT to set user context
			const { data: authData, error: authError } = await this.supabaseClient.rpc(
				'authenticate_custom_jwt',
				{
					jwt_token: token,
				}
			);

			if (authError) {
				this.logger.error('Failed to authenticate JWT:', authError);
				return { data: null, error: authError };
			}

			this.logger.log(`Authenticated user for storage upload: ${authData.user_id}`);

			// Now create a new client with the custom token for the upload
			// This ensures the token is passed with the storage request
			const url = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_URL');
			const anonKey = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_ANON_KEY');

			if (!url || !anonKey) {
				throw new Error('Supabase configuration is missing');
			}

			const authenticatedClient = createClient(url, anonKey, {
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

			// Perform the upload with the authenticated client
			const { data, error } = await authenticatedClient.storage.from(bucket).upload(path, file, {
				contentType: options?.contentType,
				upsert: options?.upsert ?? false,
			});

			if (error) {
				this.logger.error('Storage upload error:', error);
			} else {
				this.logger.log(`File uploaded successfully: ${path}`);
			}

			return { data, error };
		} catch (error) {
			this.logger.error('Unexpected error during upload:', error);
			return {
				data: null,
				error: {
					message: error instanceof Error ? error.message : 'Unexpected error during upload',
					statusCode: '500',
				},
			};
		}
	}

	/**
	 * Get the public URL for a file
	 */
	getPublicUrl(bucket: string, path: string): string {
		const { data } = this.supabaseClient.storage.from(bucket).getPublicUrl(path);

		return data.publicUrl;
	}
}
