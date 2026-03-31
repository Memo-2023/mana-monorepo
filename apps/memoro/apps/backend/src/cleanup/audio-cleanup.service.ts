import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
	CleanupResult,
	CleanupError,
	UserCleanupEnabledResponse,
} from './interfaces/cleanup.interfaces';

interface StorageObject {
	id: string;
	name: string;
	created_at: string;
	bucket_id: string;
}

@Injectable()
export class AudioCleanupService {
	private readonly logger = new Logger(AudioCleanupService.name);
	private readonly memoroServiceClient: SupabaseClient;
	private readonly memoroUrl: string;
	private readonly manaCoreMiddlewareUrl: string;
	private readonly internalApiKey: string;
	private readonly STORAGE_BUCKET = 'user-uploads';
	private readonly RETENTION_DAYS = 30;
	private readonly BATCH_SIZE = 100; // Files per deletion batch
	private readonly BATCH_DELAY_MS = 200; // Delay between batches

	constructor(private configService: ConfigService) {
		this.memoroUrl = this.configService.get<string>('MEMORO_SUPABASE_URL');
		const memoroServiceKey = this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY');
		this.manaCoreMiddlewareUrl = this.configService.get<string>('MANA_SERVICE_URL');
		this.internalApiKey = this.configService.get<string>('INTERNAL_API_KEY');

		if (!this.memoroUrl || !memoroServiceKey) {
			throw new Error('MEMORO_SUPABASE_URL or MEMORO_SUPABASE_SERVICE_KEY not provided');
		}

		this.memoroServiceClient = createClient(this.memoroUrl, memoroServiceKey);
	}

	/**
	 * Main entry point for the cleanup job.
	 * Uses direct SQL on storage.objects table for efficient file discovery.
	 */
	async runCleanup(): Promise<CleanupResult> {
		const startedAt = new Date().toISOString();
		const errors: CleanupError[] = [];
		let usersProcessed = 0;
		let totalFilesDeleted = 0;
		let totalFilesFailed = 0;

		this.logger.log('Starting audio cleanup job (SQL-based)');

		try {
			// Step 1: Get users with auto-delete enabled from mana-core-middleware
			const userIds = await this.getUsersWithCleanupEnabled();
			this.logger.log(`Found ${userIds.length} users with audio cleanup enabled`);

			if (userIds.length === 0) {
				return {
					success: true,
					usersProcessed: 0,
					filesDeleted: 0,
					filesFailed: 0,
					errors: [],
					startedAt,
					completedAt: new Date().toISOString(),
				};
			}

			// Step 2: Process each user using SQL-based cleanup
			for (const userId of userIds) {
				try {
					const result = await this.processUserCleanupSQL(userId);
					usersProcessed++;
					totalFilesDeleted += result.filesDeleted;
					totalFilesFailed += result.filesFailed;
					errors.push(...result.errors);
				} catch (error) {
					this.logger.error(`Failed to process cleanup for user ${userId}:`, error);
					errors.push({
						userId,
						error: error.message || 'Unknown error processing user cleanup',
					});
				}
			}

			// Step 3: Log the cleanup run
			await this.logCleanupRun({
				usersProcessed,
				filesDeleted: totalFilesDeleted,
				filesFailed: totalFilesFailed,
				errors,
				startedAt,
			});

			return {
				success: true,
				usersProcessed,
				filesDeleted: totalFilesDeleted,
				filesFailed: totalFilesFailed,
				errors,
				startedAt,
				completedAt: new Date().toISOString(),
			};
		} catch (error) {
			this.logger.error('Audio cleanup job failed:', error);
			return {
				success: false,
				usersProcessed,
				filesDeleted: totalFilesDeleted,
				filesFailed: totalFilesFailed,
				errors: [...errors, { error: error.message || 'Unknown error' }],
				startedAt,
				completedAt: new Date().toISOString(),
			};
		}
	}

	/**
	 * Process cleanup for a specific list of user IDs.
	 */
	async deleteOldAudiosForUsers(userIds: string[]): Promise<CleanupResult> {
		const startedAt = new Date().toISOString();
		const errors: CleanupError[] = [];
		let usersProcessed = 0;
		let totalFilesDeleted = 0;
		let totalFilesFailed = 0;

		this.logger.log(`Processing cleanup for ${userIds.length} users`);

		for (const userId of userIds) {
			try {
				const result = await this.processUserCleanupSQL(userId);
				usersProcessed++;
				totalFilesDeleted += result.filesDeleted;
				totalFilesFailed += result.filesFailed;
				errors.push(...result.errors);
			} catch (error) {
				this.logger.error(`Failed to process cleanup for user ${userId}:`, error);
				errors.push({
					userId,
					error: error.message || 'Unknown error processing user cleanup',
				});
			}
		}

		return {
			success: errors.length === 0,
			usersProcessed,
			filesDeleted: totalFilesDeleted,
			filesFailed: totalFilesFailed,
			errors,
			startedAt,
			completedAt: new Date().toISOString(),
		};
	}

	/**
	 * Process cleanup for a single user using direct SQL on storage.objects table.
	 * Queries files older than retention period and deletes them in batches.
	 */
	private async processUserCleanupSQL(userId: string): Promise<{
		filesDeleted: number;
		filesFailed: number;
		errors: CleanupError[];
	}> {
		const errors: CleanupError[] = [];
		let filesDeleted = 0;
		let filesFailed = 0;

		// Query storage.objects directly via the get_old_storage_files function
		const { data: oldFiles, error: queryError } = await this.memoroServiceClient.rpc(
			'get_old_storage_files',
			{
				p_bucket_id: this.STORAGE_BUCKET,
				p_user_id: userId,
				p_retention_days: this.RETENTION_DAYS,
			}
		);

		if (queryError) {
			this.logger.error(`Failed to query old files for user ${userId}:`, queryError);
			throw new Error(`Query error: ${queryError.message}`);
		}

		if (!oldFiles || oldFiles.length === 0) {
			this.logger.log(`No old files found for user ${userId}`);
			return { filesDeleted: 0, filesFailed: 0, errors: [] };
		}

		this.logger.log(`Found ${oldFiles.length} old files for user ${userId}`);

		// Extract unique memoIds from file paths (format: userId/memoId/filename)
		// Only include valid UUIDs (skip folders like "migration-reports")
		const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		const memoIds = new Set<string>();
		for (const file of oldFiles) {
			const parts = file.name.split('/');
			if (parts.length >= 2 && UUID_REGEX.test(parts[1])) {
				memoIds.add(parts[1]); // memoId is the second part
			}
		}

		// Delete files in batches
		const filePaths = oldFiles.map((f: StorageObject) => f.name);
		const result = await this.deleteFilesInBatches(filePaths, userId);

		filesDeleted = result.deleted;
		filesFailed = result.failed;
		errors.push(...result.errors);

		// Mark memos as audio deleted (only if files were actually deleted)
		if (filesDeleted > 0 && memoIds.size > 0) {
			await this.markMemosAsAudioDeleted(Array.from(memoIds), userId);
		}

		this.logger.log(`User ${userId}: deleted ${filesDeleted} files, failed ${filesFailed}`);
		return { filesDeleted, filesFailed, errors };
	}

	/**
	 * Mark memos as having their audio deleted.
	 * Updates source.audio_deleted and source.audio_deleted_at fields.
	 */
	private async markMemosAsAudioDeleted(memoIds: string[], userId: string): Promise<void> {
		const deletedAt = new Date().toISOString();

		for (const memoId of memoIds) {
			try {
				// First get the current source to merge with
				const { data: memo, error: fetchError } = await this.memoroServiceClient
					.from('memos')
					.select('source')
					.eq('id', memoId)
					.eq('user_id', userId)
					.maybeSingle();

				if (fetchError) {
					this.logger.warn(`Error fetching memo ${memoId}:`, fetchError);
					continue;
				}

				if (!memo) {
					// Memo doesn't exist - this is fine, just skip it
					this.logger.log(`Memo ${memoId} not found, skipping source update`);
					continue;
				}

				// Update source with audio_deleted flag and clear the path
				const updatedSource = {
					...memo.source,
					audio_path: null,
					audio_deleted: true,
					audio_deleted_at: deletedAt,
				};

				const { error: updateError } = await this.memoroServiceClient
					.from('memos')
					.update({ source: updatedSource })
					.eq('id', memoId)
					.eq('user_id', userId);

				if (updateError) {
					this.logger.warn(`Failed to mark memo ${memoId} as audio deleted:`, updateError);
				} else {
					this.logger.log(`Marked memo ${memoId} as audio deleted`);
				}
			} catch (error) {
				this.logger.warn(`Error marking memo ${memoId} as audio deleted:`, error);
			}
		}
	}

	/**
	 * Delete files in batches to avoid rate limits and timeout issues.
	 */
	private async deleteFilesInBatches(
		filePaths: string[],
		userId: string
	): Promise<{ deleted: number; failed: number; errors: CleanupError[] }> {
		const errors: CleanupError[] = [];
		let deleted = 0;
		let failed = 0;

		// Process in batches
		for (let i = 0; i < filePaths.length; i += this.BATCH_SIZE) {
			const batch = filePaths.slice(i, i + this.BATCH_SIZE);

			try {
				const { error: deleteError } = await this.memoroServiceClient.storage
					.from(this.STORAGE_BUCKET)
					.remove(batch);

				if (deleteError) {
					this.logger.error(`Batch delete failed:`, deleteError);
					failed += batch.length;
					errors.push({
						userId,
						error: `Batch delete failed: ${deleteError.message}`,
					});
				} else {
					deleted += batch.length;
					this.logger.log(
						`Deleted batch of ${batch.length} files (${i + batch.length}/${filePaths.length})`
					);
				}
			} catch (error) {
				this.logger.error(`Batch delete error:`, error);
				failed += batch.length;
				errors.push({
					userId,
					error: error.message || 'Unknown batch delete error',
				});
			}

			// Delay between batches
			if (i + this.BATCH_SIZE < filePaths.length) {
				await this.delay(this.BATCH_DELAY_MS);
			}
		}

		return { deleted, failed, errors };
	}

	/**
	 * Get users with audio auto-delete enabled from mana-core-middleware.
	 */
	private async getUsersWithCleanupEnabled(): Promise<string[]> {
		if (!this.manaCoreMiddlewareUrl || !this.internalApiKey) {
			this.logger.warn('MANA_SERVICE_URL or INTERNAL_API_KEY not configured');
			return [];
		}

		try {
			const response = await fetch(
				`${this.manaCoreMiddlewareUrl}/internal/users/audio-cleanup-enabled`,
				{
					method: 'GET',
					headers: {
						'X-Internal-API-Key': this.internalApiKey,
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
			}

			const data: UserCleanupEnabledResponse = await response.json();
			return data.userIds || [];
		} catch (error) {
			this.logger.error('Failed to get users with cleanup enabled:', error);
			throw error;
		}
	}

	/**
	 * Delay helper to avoid rate limits.
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Log cleanup run to the database for monitoring.
	 */
	private async logCleanupRun(data: {
		usersProcessed: number;
		filesDeleted: number;
		filesFailed: number;
		errors: CleanupError[];
		startedAt: string;
	}): Promise<void> {
		try {
			const { error } = await this.memoroServiceClient.from('audio_cleanup_logs').insert({
				started_at: data.startedAt,
				completed_at: new Date().toISOString(),
				status: data.errors.length === 0 ? 'completed' : 'completed_with_errors',
				users_processed: data.usersProcessed,
				files_deleted: data.filesDeleted,
				files_failed: data.filesFailed,
				error_details: data.errors.length > 0 ? data.errors : null,
			});

			if (error) {
				this.logger.warn('Failed to log cleanup run:', error);
			}
		} catch (error) {
			this.logger.warn('Failed to log cleanup run:', error);
		}
	}
}
