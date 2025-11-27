import { Injectable } from '@nestjs/common';
import { ErrorCategory } from '../consts/user-errors.const';
import { SupabaseDataService } from './supabase-data.service';

export interface ErrorLogEntry {
	userId?: string;
	errorCategory: ErrorCategory;
	technicalMessage: string;
	technicalStack?: string;
	context?: Record<string, any>;
	endpoint?: string;
	userAgent?: string;
}

@Injectable()
export class ErrorLoggingService {
	constructor(private readonly supabaseData: SupabaseDataService) {}

	/**
	 * Log an error to the database and optionally to Posthog
	 */
	async logError(entry: ErrorLogEntry): Promise<void> {
		try {
			const { error } = await this.supabaseData.client.from('error_logs').insert({
				user_id: entry.userId || null,
				error_category: entry.errorCategory,
				technical_message: entry.technicalMessage,
				technical_stack: entry.technicalStack || null,
				context: entry.context || null,
				endpoint: entry.endpoint || null,
				user_agent: entry.userAgent || null,
				created_at: new Date().toISOString(),
			});

			if (error) {
				console.error('[ErrorLoggingService] Failed to log error:', error);
			}
		} catch (err) {
			// Don't throw - logging errors shouldn't break the application
			console.error('[ErrorLoggingService] Exception while logging error:', err);
		}
	}

	/**
	 * Log an error with automatic stack trace extraction
	 */
	async logErrorFromException(
		error: Error,
		category: ErrorCategory,
		userId?: string,
		context?: Record<string, any>
	): Promise<void> {
		await this.logError({
			userId,
			errorCategory: category,
			technicalMessage: error.message,
			technicalStack: error.stack,
			context,
		});
	}

	/**
	 * Get error statistics for monitoring
	 */
	async getErrorStats(startDate: Date, endDate: Date): Promise<Record<ErrorCategory, number>> {
		try {
			const { data, error } = await this.supabaseData.client
				.from('error_logs')
				.select('error_category')
				.gte('created_at', startDate.toISOString())
				.lte('created_at', endDate.toISOString());

			if (error) {
				console.error('[ErrorLoggingService] Failed to get stats:', error);
				return {} as Record<ErrorCategory, number>;
			}

			// Count by category
			const stats: Record<string, number> = {};
			for (const log of data || []) {
				stats[log.error_category] = (stats[log.error_category] || 0) + 1;
			}

			return stats as Record<ErrorCategory, number>;
		} catch (err) {
			console.error('[ErrorLoggingService] Exception while getting stats:', err);
			return {} as Record<ErrorCategory, number>;
		}
	}
}
