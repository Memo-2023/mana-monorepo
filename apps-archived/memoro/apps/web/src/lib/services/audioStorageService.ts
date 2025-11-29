/**
 * Audio Storage Service for memoro-web
 * Manages audio files in Supabase Storage
 */

import { createAuthClient } from '$lib/supabaseClient';

export interface AudioFileInfo {
	id: string;
	name: string;
	url: string;
	size: number;
	created_at: string;
	metadata?: {
		duration?: number;
		format?: string;
		memo_id?: string;
		memo_title?: string;
	};
}

export interface AudioArchiveStats {
	totalCount: number;
	totalDurationSeconds: number;
	totalSizeBytes: number;
}

export class AudioStorageService {
	private readonly BUCKET_NAME = 'user-uploads';

	/**
	 * Get all audio files for the current user
	 */
	async getAllAudioFiles(limit = 20, offset = 0): Promise<AudioFileInfo[]> {
		const supabase = await createAuthClient();

		// List files from Supabase Storage
		const { data: files, error: listError } = await supabase.storage
			.from(this.BUCKET_NAME)
			.list('', {
				limit,
				offset,
				sortBy: { column: 'created_at', order: 'desc' },
			});

		if (listError) throw listError;
		if (!files || files.length === 0) return [];

		// Get public URLs and enrich with metadata
		const audioFiles: AudioFileInfo[] = [];

		for (const file of files) {
			// Only include audio files
			if (!this.isAudioFile(file.name)) continue;

			// Get public URL
			const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(file.name);

			// Try to find associated memo
			const memoInfo = await this.getMemoInfoForAudio(file.name);

			audioFiles.push({
				id: file.id,
				name: file.name,
				url: urlData.publicUrl,
				size: file.metadata?.size || 0,
				created_at: file.created_at || new Date().toISOString(),
				metadata: {
					format: this.getFileExtension(file.name),
					memo_id: memoInfo?.id,
					memo_title: memoInfo?.title,
				},
			});
		}

		return audioFiles;
	}

	/**
	 * Get audio archive statistics
	 */
	async getAudioArchiveStats(): Promise<AudioArchiveStats> {
		const supabase = await createAuthClient();

		// Get all files (without limit for accurate stats)
		const { data: files, error } = await supabase.storage.from(this.BUCKET_NAME).list('', {
			limit: 1000,
		});

		if (error) throw error;
		if (!files || files.length === 0) {
			return {
				totalCount: 0,
				totalDurationSeconds: 0,
				totalSizeBytes: 0,
			};
		}

		// Filter audio files
		const audioFiles = files.filter((f) => this.isAudioFile(f.name));

		// Calculate total size
		const totalSizeBytes = audioFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

		// Get durations from memos (estimate)
		let totalDurationSeconds = 0;
		try {
			const { data: memos } = await supabase
				.from('memos')
				.select('source')
				.not('source', 'is', null);

			if (memos) {
				totalDurationSeconds = memos.reduce((sum, memo) => {
					const source = memo.source as { duration_seconds?: number; duration?: number } | null;
					const duration = source?.duration_seconds || source?.duration || 0;
					return sum + duration;
				}, 0);
			}
		} catch (err) {
			console.error('Error calculating duration:', err);
		}

		return {
			totalCount: audioFiles.length,
			totalDurationSeconds,
			totalSizeBytes,
		};
	}

	/**
	 * Delete an audio file
	 */
	async deleteAudioFile(fileName: string): Promise<void> {
		const supabase = await createAuthClient();

		const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);

		if (error) throw error;
	}

	/**
	 * Download an audio file
	 */
	async downloadAudioFile(url: string, fileName: string): Promise<void> {
		const response = await fetch(url);
		const blob = await response.blob();

		// Create download link
		const downloadUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(downloadUrl);
	}

	/**
	 * Get memo information for an audio file
	 */
	private async getMemoInfoForAudio(
		audioFileName: string
	): Promise<{ id: string; title: string } | null> {
		try {
			const supabase = await createAuthClient();

			// Try to find memo by source containing the audio file name
			const { data: memos, error } = await supabase
				.from('memos')
				.select('id, title, source')
				.not('source', 'is', null);

			if (error || !memos) return null;

			// Find memo where source contains the audio file name
			const memo = memos.find((m) => {
				const source = m.source as { audioUrl?: string; audio_url?: string } | null;
				const audioUrl = source?.audioUrl || source?.audio_url || '';
				return audioUrl.includes(audioFileName);
			});

			if (!memo) return null;

			return {
				id: memo.id,
				title: memo.title || 'Untitled Memo',
			};
		} catch (err) {
			return null;
		}
	}

	/**
	 * Check if file is an audio file
	 */
	private isAudioFile(fileName: string): boolean {
		const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.webm'];
		return audioExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
	}

	/**
	 * Get file extension
	 */
	private getFileExtension(fileName: string): string {
		const parts = fileName.split('.');
		return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'AUDIO';
	}

	/**
	 * Format file size
	 */
	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	/**
	 * Format duration
	 */
	formatDuration(seconds: number): string {
		if (!seconds || seconds === 0) return '0:00';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}

		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}
}

// Export singleton instance
export const audioStorageService = new AudioStorageService();
