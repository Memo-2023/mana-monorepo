import type {
	ChatCompletionRequest,
	ChatCompletionResponse,
	HealthResponse,
	ModelsResponse,
	StreamChunk,
} from '$lib/types';
import { env } from '$env/dynamic/public';

const API_BASE = env.PUBLIC_MANA_LLM_URL || 'http://localhost:3025';

export async function getHealth(): Promise<HealthResponse> {
	const response = await fetch(`${API_BASE}/health`);
	if (!response.ok) {
		throw new Error(`Health check failed: ${response.statusText}`);
	}
	return response.json();
}

export async function getModels(): Promise<ModelsResponse> {
	const response = await fetch(`${API_BASE}/v1/models`);
	if (!response.ok) {
		throw new Error(`Failed to fetch models: ${response.statusText}`);
	}
	return response.json();
}

export async function sendCompletion(
	request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
	const response = await fetch(`${API_BASE}/v1/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...request, stream: false }),
	});
	if (!response.ok) {
		throw new Error(`Completion failed: ${response.statusText}`);
	}
	return response.json();
}

export async function* streamCompletion(
	request: ChatCompletionRequest
): AsyncGenerator<string, void, unknown> {
	const response = await fetch(`${API_BASE}/v1/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...request, stream: true }),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Completion failed: ${response.statusText} - ${error}`);
	}

	if (!response.body) {
		throw new Error('Response body is null');
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith('data: ')) continue;

				const data = trimmed.slice(6);
				if (data === '[DONE]') return;

				try {
					const parsed: StreamChunk = JSON.parse(data);
					const content = parsed.choices[0]?.delta?.content;
					if (content) yield content;
				} catch {
					// Ignore malformed JSON chunks
				}
			}
		}

		// Process remaining buffer
		if (buffer.trim()) {
			const lines = buffer.split('\n');
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith('data: ')) continue;

				const data = trimmed.slice(6);
				if (data === '[DONE]') return;

				try {
					const parsed: StreamChunk = JSON.parse(data);
					const content = parsed.choices[0]?.delta?.content;
					if (content) yield content;
				} catch {
					// Ignore malformed JSON chunks
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}
