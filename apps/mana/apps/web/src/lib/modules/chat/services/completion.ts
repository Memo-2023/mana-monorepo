/**
 * Chat completion service — streams assistant responses from mana-api.
 *
 * Used by both the route-based detail page and the workbench overlay.
 * Handles the full send → stream → persist cycle:
 *   1. Add user message to IndexedDB
 *   2. Auto-title conversation from first message
 *   3. Create empty assistant message placeholder
 *   4. POST to /api/v1/chat/completions/stream (SSE)
 *   5. Append streamed chunks to the assistant message
 */

import { getManaApiUrl } from '$lib/api/config';
import { messagesStore } from '../stores/messages.svelte';
import { conversationsStore } from '../stores/conversations.svelte';
import type { Message } from '../types';

export interface SendOptions {
	conversationId: string;
	text: string;
	/** All prior messages (for LLM context). */
	history: Array<{ sender: string; messageText: string }>;
	/** Current conversation title — used to decide whether to auto-title. */
	currentTitle?: string;
	/** Model override (default: server picks gemma3:4b). */
	model?: string;
}

export interface SendResult {
	userMessage: Message;
	assistantMessage: Message;
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
	const { conversationId, text, history, currentTitle, model } = opts;

	// 1. Persist user message
	const userMessage = await messagesStore.addUserMessage(conversationId, text);

	// 2. Auto-title from first message
	if (history.length === 0 && !currentTitle) {
		const title = text.length > 50 ? text.slice(0, 50) + '…' : text;
		await conversationsStore.updateTitle(conversationId, title);
	}

	// 3. Build LLM messages array
	const llmMessages = [
		...history.map((m) => ({
			role: m.sender === 'user' ? 'user' : 'assistant',
			content: m.messageText,
		})),
		{ role: 'user' as const, content: text },
	];

	// 4. Create assistant placeholder
	const assistantMessage = await messagesStore.addAssistantMessage(conversationId, '');

	// 5. Stream from mana-api
	const apiUrl = getManaApiUrl();
	const response = await fetch(`${apiUrl}/api/v1/chat/completions/stream`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
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

	// 6. Read SSE stream
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
				// OpenAI-compatible chunk format
				const delta = parsed.choices?.[0]?.delta?.content;
				if (delta) {
					accumulated += delta;
					onChunk?.(accumulated);
				}
			} catch {
				// Non-JSON payload (e.g. error string) — append as-is
				if (payload && payload !== '[DONE]') {
					accumulated += payload;
					onChunk?.(accumulated);
				}
			}
		}
	}

	// 7. Final persist
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
