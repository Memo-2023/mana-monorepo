/**
 * HTTP client for mana-llm — OpenAI-compatible chat completions endpoint.
 * Used by the query classifier (short prompt → JSON tag).
 */

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export class ManaLlmClient {
	constructor(private baseUrl: string) {}

	async chat(
		messages: ChatMessage[],
		opts: { model?: string; maxTokens?: number; temperature?: number; signal?: AbortSignal } = {}
	): Promise<{ content: string; tokenUsage?: { input: number; output: number } }> {
		const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: opts.model ?? 'ollama/gemma3:4b',
				messages,
				max_tokens: opts.maxTokens ?? 256,
				temperature: opts.temperature ?? 0.2,
			}),
			signal: opts.signal,
		});
		if (!res.ok) {
			throw new Error(`mana-llm returned ${res.status}`);
		}
		type ChatResponse = {
			choices?: Array<{ message?: { content?: string } }>;
			usage?: { prompt_tokens?: number; completion_tokens?: number };
		};
		const data = (await res.json()) as ChatResponse;
		const content = data.choices?.[0]?.message?.content ?? '';
		const tokenUsage = data.usage
			? {
					input: data.usage.prompt_tokens ?? 0,
					output: data.usage.completion_tokens ?? 0,
				}
			: undefined;
		return { content, tokenUsage };
	}
}
