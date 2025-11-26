/**
 * Question Service for memoro-web
 * Handles Q&A functionality for memos
 */

import { env } from '$lib/config/env';
import { tokenManager } from './tokenManager';
import { createAuthClient } from '$lib/supabaseClient';
import type { Memory } from '$lib/types/memo.types';

export interface QuestionResult {
	success: boolean;
	memoryId?: string;
	error?: string;
	creditsConsumed?: number;
}

export type { Memory };

class QuestionService {
	/**
	 * Ask a question about a memo
	 * This calls the memoro middleware service to generate an AI answer
	 */
	async askQuestion(memoId: string, question: string): Promise<QuestionResult> {
		if (!memoId || !question.trim()) {
			return {
				success: false,
				error: 'Invalid memo ID or question'
			};
		}

		try {
			// Get a valid token
			const token = await tokenManager.getValidToken();
			if (!token) {
				return {
					success: false,
					error: 'Nicht authentifiziert. Bitte melden Sie sich erneut an.'
				};
			}

			// Get the memoro service URL
			const memoroServiceUrl = env.middleware.memoroUrl?.replace(/\/$/, '');
			if (!memoroServiceUrl) {
				return {
					success: false,
					error: 'Memoro service URL nicht konfiguriert'
				};
			}

			// Call the memoro service
			const response = await fetch(`${memoroServiceUrl}/memoro/question-memo`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					memo_id: memoId,
					question: question.trim()
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				// Handle specific error codes
				if (response.status === 402) {
					return {
						success: false,
						error: 'Nicht genügend Mana. Bitte laden Sie Ihr Konto auf.'
					};
				}

				if (response.status === 401) {
					return {
						success: false,
						error: 'Sitzung abgelaufen. Bitte melden Sie sich erneut an.'
					};
				}

				return {
					success: false,
					error: errorData.message || `Fehler: ${response.status} ${response.statusText}`
				};
			}

			const data = await response.json();

			if (data?.success && data?.memory_id) {
				return {
					success: true,
					memoryId: data.memory_id,
					creditsConsumed: data.creditsConsumed
				};
			}

			return {
				success: false,
				error: data?.error || 'Unbekannter Fehler bei der Verarbeitung'
			};
		} catch (error) {
			console.error('Error asking question:', error);

			// Check for network errors
			if (error instanceof TypeError && error.message.includes('fetch')) {
				return {
					success: false,
					error: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unbekannter Fehler'
			};
		}
	}

	/**
	 * Load memories for a memo
	 */
	async loadMemories(memoId: string): Promise<Memory[]> {
		try {
			const supabase = await createAuthClient();

			const { data, error } = await supabase
				.from('memories')
				.select('id, memo_id, title, content, metadata, style, media, created_at, updated_at')
				.eq('memo_id', memoId)
				.order('sort_order', { ascending: true })
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error loading memories:', error);
				return [];
			}

			// Transform data to match Memory interface
			return (data || []).map(item => ({
				id: item.id,
				memo_id: item.memo_id,
				title: item.title,
				content: item.content,
				metadata: item.metadata as Record<string, any> | null | undefined,
				style: item.style as Record<string, any> | null | undefined,
				media: item.media as Record<string, any> | null | undefined,
				created_at: item.created_at,
				updated_at: item.updated_at
			}));
		} catch (error) {
			console.error('Error loading memories:', error);
			return [];
		}
	}
}

// Export singleton instance
export const questionService = new QuestionService();
