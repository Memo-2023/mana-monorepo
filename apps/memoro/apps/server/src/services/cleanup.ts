/**
 * Audio cleanup service for Memoro server.
 *
 * Deletes audio files older than 30 days for opted-in users.
 */

import { createServiceClient } from '../lib/supabase';

const RETENTION_DAYS = 30;
const BATCH_SIZE = 100;
const BUCKET = 'user-uploads';
const MANA_CREDITS_URL = () => process.env.MANA_CREDITS_URL ?? process.env.MANA_AUTH_URL ?? 'http://localhost:3061';
const MANA_SERVICE_KEY = () => process.env.MANA_SERVICE_KEY ?? '';

interface CleanupResult {
	deleted: number;
	errors: number;
}

/**
 * Run audio cleanup for specified users, or all opted-in users if none provided.
 */
export async function runAudioCleanup(userIds?: string[]): Promise<CleanupResult> {
	const supabase = createServiceClient();
	let result: CleanupResult = { deleted: 0, errors: 0 };

	const logId = await startCleanupLog(supabase);

	try {
		const targetUserIds = userIds && userIds.length > 0
			? userIds
			: await fetchOptedInUserIds();

		console.log(`[cleanup] Processing ${targetUserIds.length} users`);

		for (const userId of targetUserIds) {
			try {
				const userResult = await cleanupUserAudios(userId);
				result.deleted += userResult.deleted;
				result.errors += userResult.errors;
			} catch (err) {
				console.error(`[cleanup] Failed for user ${userId}:`, err);
				result.errors++;
			}
		}

		await finishCleanupLog(supabase, logId, result);
		console.log(`[cleanup] Done: ${result.deleted} deleted, ${result.errors} errors`);
	} catch (err) {
		console.error('[cleanup] Fatal error:', err);
		await finishCleanupLog(supabase, logId, result, err instanceof Error ? err.message : String(err));
		result.errors++;
	}

	return result;
}

async function cleanupUserAudios(userId: string): Promise<CleanupResult> {
	const supabase = createServiceClient();
	const result: CleanupResult = { deleted: 0, errors: 0 };

	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
	const cutoffIso = cutoffDate.toISOString();

	// List files in user's folder older than cutoff
	const prefix = `${userId}/`;
	const { data: files, error: listError } = await supabase.storage
		.from(BUCKET)
		.list(prefix, { limit: 1000 });

	if (listError) {
		console.error(`[cleanup] Failed to list files for user ${userId}: ${listError.message}`);
		return { deleted: 0, errors: 1 };
	}

	if (!files || files.length === 0) return result;

	// Filter files older than cutoff
	const oldFiles = files.filter((file) => {
		const created = file.created_at ?? file.updated_at;
		return created && created < cutoffIso;
	});

	if (oldFiles.length === 0) return result;

	console.log(`[cleanup] User ${userId}: ${oldFiles.length} files to delete`);

	// Delete in batches
	for (let i = 0; i < oldFiles.length; i += BATCH_SIZE) {
		const batch = oldFiles.slice(i, i + BATCH_SIZE);
		const paths = batch.map((f) => `${prefix}${f.name}`);

		const { error: deleteError } = await supabase.storage.from(BUCKET).remove(paths);

		if (deleteError) {
			console.error(`[cleanup] Batch delete failed: ${deleteError.message}`);
			result.errors += batch.length;
		} else {
			result.deleted += batch.length;

			// Update memo records for deleted files
			for (const file of batch) {
				const filePath = `${prefix}${file.name}`;
				await updateMemoAudioDeleted(supabase, filePath);
			}
		}
	}

	return result;
}

async function updateMemoAudioDeleted(
	supabase: ReturnType<typeof createServiceClient>,
	audioPath: string
): Promise<void> {
	// Find memo(s) with this audio path
	const { data: memos, error: fetchError } = await supabase
		.from('memos')
		.select('id, source')
		.contains('source', { audio_path: audioPath });

	if (fetchError || !memos || memos.length === 0) return;

	const now = new Date().toISOString();

	for (const memo of memos) {
		const source = (memo.source as Record<string, unknown>) ?? {};
		const updatedSource = {
			...source,
			audio_path: null,
			audio_deleted: true,
			audio_deleted_at: now,
		};

		await supabase
			.from('memos')
			.update({ source: updatedSource, updated_at: now })
			.eq('id', memo.id);
	}
}

async function fetchOptedInUserIds(): Promise<string[]> {
	const serviceKey = MANA_SERVICE_KEY();
	if (!serviceKey) {
		console.warn('[cleanup] MANA_SERVICE_KEY not set, cannot fetch opted-in users');
		return [];
	}

	try {
		const response = await fetch(
			`${MANA_CREDITS_URL()}/api/v1/internal/users/audio-cleanup-enabled`,
			{
				headers: {
					'X-Service-Key': serviceKey,
				},
			}
		);

		if (!response.ok) {
			console.warn(`[cleanup] Failed to fetch opted-in users: ${response.status}`);
			return [];
		}

		const data = (await response.json()) as { userIds?: string[] };
		return data.userIds ?? [];
	} catch (err) {
		console.error('[cleanup] Error fetching opted-in users:', err);
		return [];
	}
}

async function startCleanupLog(
	supabase: ReturnType<typeof createServiceClient>
): Promise<string | null> {
	try {
		const { data } = await supabase
			.from('audio_cleanup_logs')
			.insert({
				id: crypto.randomUUID(),
				started_at: new Date().toISOString(),
				status: 'running',
			})
			.select('id')
			.single();
		return (data as { id: string } | null)?.id ?? null;
	} catch {
		return null;
	}
}

async function finishCleanupLog(
	supabase: ReturnType<typeof createServiceClient>,
	logId: string | null,
	result: CleanupResult,
	errorMessage?: string
): Promise<void> {
	if (!logId) return;
	try {
		await supabase
			.from('audio_cleanup_logs')
			.update({
				finished_at: new Date().toISOString(),
				status: errorMessage ? 'failed' : 'completed',
				files_deleted: result.deleted,
				errors: result.errors,
				error_message: errorMessage ?? null,
			})
			.eq('id', logId);
	} catch {
		// Non-critical
	}
}
