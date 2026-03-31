/**
 * Question Service for memoro-web
 * Handles Q&A functionality for memos via memoro-server (Hono/Bun).
 */

import { env } from '$lib/config/env';
import { authStore } from '$lib/stores/auth.svelte';
import { createAuthClient } from '$lib/supabaseClient';

const SERVER_URL = () => env.server.memoroUrl.replace(/\/$/, '');

export interface QuestionResult {
	success: boolean;
	answer?: string;
	memoryId?: string;
	error?: string;
	creditsConsumed?: number;
}

export interface Memory {
	id: string;
	memo_id: string;
	title: string;
	content: string | null;
	metadata?: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
}

class QuestionService {
	async askQuestion(memoId: string, question: string): Promise<QuestionResult> {
		if (!memoId || !question.trim()) {
			return { success: false, error: 'Invalid memo ID or question' };
		}

		try {
			const token = await authStore.getAccessToken();
			if (!token) {
				return { success: false, error: 'Nicht authentifiziert. Bitte melden Sie sich erneut an.' };
			}

			const response = await fetch(`${SERVER_URL()}/api/v1/memos/${memoId}/question`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ question: question.trim() }),
			});

			if (!response.ok) {
				if (response.status === 402) {
					return { success: false, error: 'Nicht genügend Mana. Bitte laden Sie Ihr Konto auf.' };
				}
				if (response.status === 401) {
					return { success: false, error: 'Sitzung abgelaufen. Bitte melden Sie sich erneut an.' };
				}
				const d = await response.json().catch(() => ({}));
				return { success: false, error: d.error || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { success: true, answer: data.answer, creditsConsumed: data.creditsConsumed };
		} catch (error) {
			if (error instanceof TypeError && error.message.includes('fetch')) {
				return { success: false, error: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.' };
			}
			return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
		}
	}

	async loadMemories(memoId: string): Promise<Memory[]> {
		try {
			const supabase = await createAuthClient();
			const { data, error } = await supabase
				.from('memories')
				.select('id, title, content, metadata')
				.eq('memo_id', memoId)
				.order('sort_order', { ascending: true })
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error loading memories:', error);
				return [];
			}
			return data || [];
		} catch (error) {
			console.error('Error loading memories:', error);
			return [];
		}
	}
}

export const questionService = new QuestionService();
