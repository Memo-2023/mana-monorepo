/**
 * Chat completion service — streams assistant responses from mana-api.
 *
 * Used by both the route-based detail page and the workbench overlay.
 * Handles the full send → stream → persist cycle:
 *   1. Add user message to IndexedDB
 *   2. Auto-title conversation from first message
 *   3. Resolve template system prompt (if conversation has templateId)
 *   4. Create empty assistant message placeholder
 *   5. POST to /api/v1/chat/completions/stream (SSE) with auth
 *   6. Append streamed chunks to the assistant message (debounced persist)
 */

import { getManaApiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { messagesStore } from '../stores/messages.svelte';
import { conversationsStore } from '../stores/conversations.svelte';
import type { LocalTemplate, Message } from '../types';

export interface SendOptions {
	conversationId: string;
	text: string;
	/** All prior messages (for LLM context). */
	history: Array<{ sender: string; messageText: string }>;
	/** Current conversation title — used to decide whether to auto-title. */
	currentTitle?: string;
	/** Template ID — if set, its systemPrompt is prepended to the LLM messages. */
	templateId?: string;
	/** Model override (default: server picks gemma3:4b). */
	model?: string;
}

export interface SendResult {
	userMessage: Message;
	assistantMessage: Message;
}

/** Debounce interval for persisting streaming text to IndexedDB. */
const PERSIST_INTERVAL_MS = 250;

/**
 * Resolve the system prompt for a template. Returns null if the template
 * doesn't exist or has no system prompt. Decrypts the template fields
 * since systemPrompt is encrypted at rest.
 */
async function resolveSystemPrompt(templateId: string | undefined): Promise<string | null> {
	if (!templateId) return null;
	const local = await db.table<LocalTemplate>('chatTemplates').get(templateId);
	if (!local || local.deletedAt) return null;
	const [decrypted] = await decryptRecords('chatTemplates', [local]);
	return decrypted?.systemPrompt?.trim() || null;
}

/**
 * Build the Authorization header from the current session token.
 * Returns an empty object when no token is available (guest mode).
 */
async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getValidToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Send a user message and stream the assistant response.
 *
 * @param onChunk  Called with the accumulated assistant text on every SSE chunk.
 *                 Use this to drive optimistic UI updates while the stream is open.
 * @returns        The final user + assistant messages after the stream closes.
 * @throws         On network errors or non-200 responses.
 */
export async function sendAndStream(
	opts: SendOptions,
	onChunk?: (accumulated: string) => void
): Promise<SendResult> {
	const { conversationId, text, history, currentTitle, templateId, model } = opts;

	// 1. Persist user message
	const userMessage = await messagesStore.addUserMessage(conversationId, text);

	// 2. Auto-title from first message
	if (history.length === 0 && !currentTitle) {
		const title = text.length > 50 ? text.slice(0, 50) + '…' : text;
		await conversationsStore.updateTitle(conversationId, title);
	}

	// 3. Build LLM messages array — prepend system prompt if template is set
	const systemPrompt = await resolveSystemPrompt(templateId);
	const llmMessages: Array<{ role: string; content: string }> = [];

	if (systemPrompt) {
		llmMessages.push({ role: 'system', content: systemPrompt });
	}

	llmMessages.push(
		...history.map((m) => ({
			role: m.sender === 'user' ? 'user' : m.sender === 'system' ? 'system' : 'assistant',
			content: m.messageText,
		})),
		{ role: 'user', content: text }
	);

	// 4. Create assistant placeholder
	const assistantMessage = await messagesStore.addAssistantMessage(conversationId, '');

	// 5. Stream from mana-api (with auth)
	const apiUrl = getManaApiUrl();
	const response = await fetch(`${apiUrl}/api/v1/chat/completions/stream`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(await authHeader()),
		},
		body: JSON.stringify({
			messages: llmMessages,
			model: model ?? undefined,
		}),
	});

	if (!response.ok) {
		const errText = await response.text().catch(() => response.statusText);
		const fallback =
			response.status === 402 ? 'Nicht genügend Credits für diese Anfrage.' : `Fehler: ${errText}`;
		await messagesStore.updateText(assistantMessage.id, fallback);
		return { userMessage, assistantMessage: { ...assistantMessage, messageText: fallback } };
	}

	// 6. Read SSE stream with debounced persist
	let accumulated = '';
	const reader = response.body?.getReader();
	if (!reader) {
		await messagesStore.updateText(assistantMessage.id, '(keine Antwort)');
		return {
			userMessage,
			assistantMessage: { ...assistantMessage, messageText: '(keine Antwort)' },
		};
	}

	const decoder = new TextDecoder();
	let buffer = '';
	let lastPersist = 0;
	let persistTimer: ReturnType<typeof setTimeout> | null = null;

	function schedulePersist() {
		const now = Date.now();
		if (now - lastPersist >= PERSIST_INTERVAL_MS) {
			lastPersist = now;
			void messagesStore.updateText(assistantMessage.id, accumulated);
		} else if (!persistTimer) {
			persistTimer = setTimeout(
				() => {
					persistTimer = null;
					lastPersist = Date.now();
					void messagesStore.updateText(assistantMessage.id, accumulated);
				},
				PERSIST_INTERVAL_MS - (now - lastPersist)
			);
		}
	}

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';

		for (const line of lines) {
			if (!line.startsWith('data:')) continue;
			const payload = line.slice(5).trim();
			if (payload === '[DONE]') continue;

			try {
				const parsed = JSON.parse(payload);
				const delta = parsed.choices?.[0]?.delta?.content;
				if (delta) {
					accumulated += delta;
					onChunk?.(accumulated);
					schedulePersist();
				}
			} catch {
				if (payload && payload !== '[DONE]') {
					accumulated += payload;
					onChunk?.(accumulated);
					schedulePersist();
				}
			}
		}
	}

	// 7. Final persist (cancel any pending debounce)
	if (persistTimer) clearTimeout(persistTimer);

	if (accumulated) {
		await messagesStore.updateText(assistantMessage.id, accumulated);
	} else {
		await messagesStore.updateText(assistantMessage.id, '(keine Antwort)');
		accumulated = '(keine Antwort)';
	}

	return {
		userMessage,
		assistantMessage: { ...assistantMessage, messageText: accumulated },
	};
}
