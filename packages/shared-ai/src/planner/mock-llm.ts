/**
 * Scriptable MockLlmClient — drives runPlannerLoop in tests without
 * hitting a real LLM. Each ``enqueue*`` call queues one assistant
 * turn; the loop consumes them FIFO. Unscripted turns throw loudly
 * so tests fail fast instead of hanging.
 */

import type { ChatMessage, LlmClient, LlmCompletionRequest, LlmCompletionResponse } from './loop';

export interface MockLlmTurn {
	messages: readonly ChatMessage[];
	toolNames: string[];
}

export class MockLlmClient implements LlmClient {
	private queue: LlmCompletionResponse[] = [];
	/** Snapshots of each inbound call. Use to assert what the LLM saw
	 *  on each round (messages + tool schemas). */
	public readonly calls: MockLlmTurn[] = [];

	enqueueToolCalls(calls: Array<{ name: string; args: Record<string, unknown> }>): this {
		this.queue.push({
			content: null,
			toolCalls: calls.map((c, i) => ({
				id: `call_${this.queue.length}_${i}`,
				name: c.name,
				arguments: c.args,
			})),
			finishReason: 'tool_calls',
		});
		return this;
	}

	enqueueStop(content: string | null = null): this {
		this.queue.push({ content, toolCalls: [], finishReason: 'stop' });
		return this;
	}

	async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
		// Snapshot at call-time — the loop mutates the array after, and
		// tests want to assert the state the LLM actually saw.
		this.calls.push({
			messages: [...req.messages],
			toolNames: req.tools.map((t) => t.function.name),
		});
		const next = this.queue.shift();
		if (!next) throw new Error('MockLlmClient: no more responses enqueued');
		return next;
	}
}
