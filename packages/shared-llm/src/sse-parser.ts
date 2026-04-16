/**
 * Shared SSE parser for OpenAI-compatible streaming responses.
 *
 * The wire format from mana-llm is straight OpenAI: `data: {…}\n\n`
 * lines with a sentinel `data: [DONE]`. This ~40-line reader is simpler
 * than adding a dependency and is shared between the LLM orchestrator
 * (backends/remote.ts) and the playground module.
 */

export interface SSEUsage {
	readonly promptTokens: number;
	readonly completionTokens: number;
}

/**
 * Consume a ReadableStream of SSE chunks from an OpenAI-compatible
 * `/v1/chat/completions` endpoint.
 *
 * Calls `onDelta` for each content token and `onUsage` (if provided)
 * when the final usage stats arrive. Returns the accumulated full
 * content string once the stream is done.
 */
export async function consumeSSEStream(
	body: ReadableStream<Uint8Array>,
	onDelta?: (content: string) => void,
	onUsage?: (usage: SSEUsage) => void
): Promise<string> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let content = '';

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		// SSE frames are separated by blank lines. Process complete frames
		// and leave any partial trailing frame in the buffer.
		let sep: number;
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			const frame = buffer.slice(0, sep);
			buffer = buffer.slice(sep + 2);

			for (const line of frame.split('\n')) {
				if (!line.startsWith('data:')) continue;
				const data = line.slice(5).trim();
				if (!data || data === '[DONE]') continue;
				try {
					const json = JSON.parse(data) as {
						choices?: Array<{ delta?: { content?: string } }>;
						usage?: { prompt_tokens?: number; completion_tokens?: number };
					};
					const delta = json.choices?.[0]?.delta?.content;
					if (delta) {
						content += delta;
						onDelta?.(delta);
					}
					if (json.usage?.prompt_tokens != null) {
						onUsage?.({
							promptTokens: json.usage.prompt_tokens,
							completionTokens: json.usage.completion_tokens ?? 0,
						});
					}
				} catch {
					// Malformed frame — skip silently. mana-llm occasionally
					// emits keepalive comments.
				}
			}
		}
	}

	return content;
}
