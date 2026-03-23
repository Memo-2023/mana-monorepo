import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmClient } from '../llm-client';
import type { ResolvedLlmOptions } from '../interfaces/llm-options.interface';
import type { ChatCompletionResponse } from '../types/openai-compat.types';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const DEFAULT_OPTIONS: ResolvedLlmOptions = {
	manaLlmUrl: 'http://localhost:3025',
	defaultModel: 'ollama/gemma3:4b',
	defaultVisionModel: 'ollama/llava:7b',
	timeout: 30_000,
	maxRetries: 0, // No retries in tests for simplicity
	debug: false,
};

function mockCompletionResponse(
	content: string,
	model = 'ollama/gemma3:4b'
): ChatCompletionResponse {
	return {
		id: 'chatcmpl-test123',
		object: 'chat.completion',
		created: Date.now(),
		model,
		choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
		usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
	};
}

function mockFetchOk(body: unknown): void {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(JSON.stringify(body)),
	} as unknown as Response);
}

function mockFetchError(status: number, body = ''): void {
	mockFetch.mockResolvedValueOnce({
		ok: false,
		status,
		statusText: `Error ${status}`,
		json: () => Promise.resolve({}),
		text: () => Promise.resolve(body),
	} as unknown as Response);
}

describe('LlmClient', () => {
	let client: LlmClient;

	beforeEach(() => {
		vi.clearAllMocks();
		client = new LlmClient(DEFAULT_OPTIONS);
	});

	describe('chat', () => {
		it('sends correct request body', async () => {
			mockFetchOk(mockCompletionResponse('Hello!'));

			await client.chat('Hi there');

			expect(mockFetch).toHaveBeenCalledTimes(1);
			const [url, init] = mockFetch.mock.calls[0];
			expect(url).toBe('http://localhost:3025/v1/chat/completions');

			const body = JSON.parse(init.body);
			expect(body.model).toBe('ollama/gemma3:4b');
			expect(body.messages).toEqual([{ role: 'user', content: 'Hi there' }]);
			expect(body.stream).toBe(false);
		});

		it('includes system prompt when provided', async () => {
			mockFetchOk(mockCompletionResponse('Response'));

			await client.chat('Question', { systemPrompt: 'You are helpful.' });

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.messages).toEqual([
				{ role: 'system', content: 'You are helpful.' },
				{ role: 'user', content: 'Question' },
			]);
		});

		it('uses custom model and temperature', async () => {
			mockFetchOk(mockCompletionResponse('Response'));

			await client.chat('Prompt', { model: 'openrouter/gpt-4o', temperature: 0.3 });

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.model).toBe('openrouter/gpt-4o');
			expect(body.temperature).toBe(0.3);
		});

		it('returns ChatResult with content and usage', async () => {
			mockFetchOk(mockCompletionResponse('Generated text'));

			const result = await client.chat('Prompt');

			expect(result.content).toBe('Generated text');
			expect(result.model).toBe('ollama/gemma3:4b');
			expect(result.usage.total_tokens).toBe(30);
			expect(result.latencyMs).toBeGreaterThanOrEqual(0);
		});

		it('throws on error response', async () => {
			mockFetchError(500, 'Internal Server Error');

			await expect(client.chat('Prompt')).rejects.toThrow('mana-llm error 500');
		});
	});

	describe('json', () => {
		it('extracts JSON from response', async () => {
			mockFetchOk(mockCompletionResponse('{"category": "bug", "title": "Fix it"}'));

			const result = await client.json<{ category: string; title: string }>('Analyze this');

			expect(result.data).toEqual({ category: 'bug', title: 'Fix it' });
			expect(result.content).toBe('{"category": "bug", "title": "Fix it"}');
		});

		it('extracts JSON from markdown-wrapped response', async () => {
			mockFetchOk(mockCompletionResponse('```json\n{"key": "value"}\n```'));

			const result = await client.json('Parse this');
			expect(result.data).toEqual({ key: 'value' });
		});

		it('applies validation function', async () => {
			mockFetchOk(mockCompletionResponse('{"name": "test"}'));

			const validate = (data: unknown) => {
				const obj = data as { name: string };
				if (typeof obj.name !== 'string') throw new Error('invalid');
				return obj;
			};

			const result = await client.json('Prompt', { validate });
			expect(result.data.name).toBe('test');
		});

		it('retries JSON extraction on parse failure', async () => {
			// First attempt returns bad JSON, second returns good
			mockFetchOk(mockCompletionResponse('not json at all'));
			mockFetchOk(mockCompletionResponse('{"valid": true}'));

			const result = await client.json('Prompt', { jsonRetries: 1 });
			expect(result.data).toEqual({ valid: true });
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});

	describe('vision', () => {
		it('builds multimodal message with base64 image', async () => {
			mockFetchOk(mockCompletionResponse('A rose'));

			await client.vision('What is this?', 'abc123base64', 'image/jpeg');

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.model).toBe('ollama/llava:7b');
			expect(body.messages[0].content).toEqual([
				{ type: 'text', text: 'What is this?' },
				{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,abc123base64' } },
			]);
		});

		it('uses data URL as-is if already formatted', async () => {
			mockFetchOk(mockCompletionResponse('A cat'));

			await client.vision('What?', 'data:image/png;base64,xyz');

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			const imageUrl = body.messages[0].content[1].image_url.url;
			expect(imageUrl).toBe('data:image/png;base64,xyz');
		});

		it('uses custom vision model when specified', async () => {
			mockFetchOk(mockCompletionResponse('Result'));

			await client.vision('Prompt', 'img', 'image/jpeg', {
				visionModel: 'ollama/qwen3-vl:4b',
			});

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.model).toBe('ollama/qwen3-vl:4b');
		});
	});

	describe('visionJson', () => {
		it('extracts JSON from vision response', async () => {
			mockFetchOk(mockCompletionResponse('```json\n{"species": "Rose", "confidence": 0.95}\n```'));

			const result = await client.visionJson<{ species: string }>(
				'Identify plant',
				'imgdata',
				'image/jpeg'
			);

			expect(result.data.species).toBe('Rose');
		});
	});

	describe('health', () => {
		it('returns health status', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						status: 'healthy',
						providers: { ollama: { status: 'healthy' } },
					}),
			} as unknown as Response);

			const health = await client.health();
			expect(health.status).toBe('healthy');
		});

		it('returns unhealthy on network error', async () => {
			mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

			const health = await client.health();
			expect(health.status).toBe('unhealthy');
		});
	});

	describe('listModels', () => {
		it('returns model list', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						data: [{ id: 'ollama/gemma3:4b', object: 'model', created: 0, owned_by: 'ollama' }],
					}),
			} as unknown as Response);

			const models = await client.listModels();
			expect(models).toHaveLength(1);
			expect(models[0].id).toBe('ollama/gemma3:4b');
		});
	});

	describe('chatMessages', () => {
		it('sends full message history', async () => {
			mockFetchOk(mockCompletionResponse('Answer'));

			await client.chatMessages([
				{ role: 'system', content: 'Be brief.' },
				{ role: 'user', content: 'Hello' },
				{ role: 'assistant', content: 'Hi!' },
				{ role: 'user', content: 'How are you?' },
			]);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.messages).toHaveLength(4);
		});
	});

	describe('embed', () => {
		it('sends embedding request', async () => {
			mockFetchOk({
				object: 'list',
				data: [{ object: 'embedding', index: 0, embedding: [0.1, 0.2, 0.3] }],
				model: 'ollama/gemma3:4b',
				usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
			});

			const result = await client.embed('Hello world');
			expect(result.embeddings).toHaveLength(1);
			expect(result.embeddings[0]).toEqual([0.1, 0.2, 0.3]);
		});
	});
});
