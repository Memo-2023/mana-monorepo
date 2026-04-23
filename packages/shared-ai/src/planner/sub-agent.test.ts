import { describe, expect, it, vi } from 'vitest';
import {
	MAX_SUB_AGENT_DEPTH,
	SubAgentRecursionError,
	runSubAgent,
	type SubAgentType,
} from './sub-agent';
import { MockLlmClient } from './mock-llm';
import type { ToolCallRequest, ToolResult } from './loop';
import type { ToolSchema } from '../tools/schemas';

// ─── Fixtures ──────────────────────────────────────────────────────

const tools: ToolSchema[] = [
	{
		name: 'list_things',
		module: 'test',
		description: 'read-only listing',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'get_thing',
		module: 'test',
		description: 'read one',
		defaultPolicy: 'auto',
		parameters: [{ name: 'id', type: 'string', description: 'id', required: true }],
	},
	{
		name: 'create_thing',
		module: 'test',
		description: 'writes',
		defaultPolicy: 'propose',
		parameters: [{ name: 'title', type: 'string', description: 'title', required: true }],
	},
	{
		name: 'delete_thing',
		module: 'test',
		description: 'destructive',
		defaultPolicy: 'propose',
		parameters: [{ name: 'id', type: 'string', description: 'id', required: true }],
	},
];

function baseInput(type: SubAgentType) {
	return {
		type,
		task: 'Find all todo items that mention foo and summarise.',
		parentTools: tools,
		parentDepth: 0,
		model: 'google/gemini-2.5-flash',
	};
}

// ─── Recursion guard ───────────────────────────────────────────────

describe('runSubAgent — recursion guard', () => {
	it('throws SubAgentRecursionError when parentDepth >= MAX_SUB_AGENT_DEPTH', async () => {
		const llm = new MockLlmClient();
		await expect(
			runSubAgent({
				...baseInput('research'),
				parentDepth: MAX_SUB_AGENT_DEPTH,
				llm,
				onToolCall: async () => ({ success: true, message: '' }),
			})
		).rejects.toBeInstanceOf(SubAgentRecursionError);
	});

	it('proceeds at parentDepth = 0', async () => {
		const llm = new MockLlmClient().enqueueStop('ok');
		const res = await runSubAgent({
			...baseInput('research'),
			parentDepth: 0,
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});
		expect(res.summary).toBe('ok');
	});
});

// ─── Tool filtering by type ────────────────────────────────────────

describe('runSubAgent — tool whitelisting', () => {
	it('research type exposes only auto-policy tools to the LLM', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		const res = await runSubAgent({
			...baseInput('research'),
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});
		expect(res.availableToolCount).toBe(2); // list_things + get_thing
		// The LLM saw the filtered toolset in its schema
		const toolNames = llm.calls[0].toolNames;
		expect(toolNames).toEqual(expect.arrayContaining(['list_things', 'get_thing']));
		expect(toolNames).not.toContain('create_thing');
		expect(toolNames).not.toContain('delete_thing');
	});

	it('general type passes every tool through', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		const res = await runSubAgent({
			...baseInput('general'),
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});
		expect(res.availableToolCount).toBe(tools.length);
	});

	it('plan type also exposes read-only (same filter as research)', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		const res = await runSubAgent({
			...baseInput('plan'),
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});
		expect(res.availableToolCount).toBe(2);
	});

	it('custom toolFilter overrides the type default', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		const res = await runSubAgent({
			...baseInput('general'),
			toolFilter: (t) => t.name === 'get_thing',
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});
		expect(res.availableToolCount).toBe(1);
	});

	it('belt-and-suspenders: rejects tool calls outside the whitelist', async () => {
		// LLM (misbehaving) asks for create_thing inside a research agent
		const llm = new MockLlmClient()
			.enqueueToolCalls([{ name: 'create_thing', args: { title: 'nope' } }])
			.enqueueStop('fell back to a summary');

		const dispatcherCalls: string[] = [];
		const onToolCall = async (call: ToolCallRequest): Promise<ToolResult> => {
			dispatcherCalls.push(call.name);
			return { success: true, message: 'should-not-be-called' };
		};

		const res = await runSubAgent({
			...baseInput('research'),
			llm,
			onToolCall,
		});

		// The caller's dispatcher was NEVER invoked — the wrapper rejected it.
		expect(dispatcherCalls).toEqual([]);

		// The LLM received a failure tool-message so it can change course.
		const secondCall = llm.calls[1].messages;
		const toolMsg = secondCall[secondCall.length - 1];
		expect(toolMsg.role).toBe('tool');
		expect(toolMsg.content).toContain('nicht freigegeben');
		expect(res.summary).toBe('fell back to a summary');
	});
});

// ─── Isolation (context-laundering) ────────────────────────────────

describe('runSubAgent — context isolation', () => {
	it('starts with a fresh messages array — no parent context leaks in', async () => {
		const llm = new MockLlmClient().enqueueStop('clean');
		await runSubAgent({
			...baseInput('research'),
			task: 'scan things',
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});

		// What the LLM saw: [system, user] — no prior-messages leakage
		const seen = llm.calls[0].messages;
		expect(seen).toHaveLength(2);
		expect(seen[0].role).toBe('system');
		expect(seen[0].content).toContain('Sub-Agent');
		expect(seen[1].role).toBe('user');
		expect(seen[1].content).toBe('scan things');
	});

	it('exposes usage roll-up from the underlying loop', async () => {
		const llm = new MockLlmClient();
		(llm as unknown as { queue: unknown[] }).queue.push({
			content: 'done',
			toolCalls: [],
			finishReason: 'stop',
			usage: { promptTokens: 500, completionTokens: 120, totalTokens: 620 },
		});

		const res = await runSubAgent({
			...baseInput('research'),
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});
		expect(res.usage.promptTokens).toBe(500);
		expect(res.usage.completionTokens).toBe(120);
		expect(res.usage.totalTokens).toBe(620);
	});

	it('falls back to a default summary when the LLM hits maxRounds without stopping', async () => {
		const llm = new MockLlmClient();
		for (let i = 0; i < 10; i++) {
			llm.enqueueToolCalls([{ name: 'list_things', args: {} }]);
		}

		const res = await runSubAgent({
			...baseInput('research'),
			maxRounds: 3,
			llm,
			onToolCall: async () => ({ success: true, message: 'ok' }),
		});

		expect(res.rawResult.stopReason).toBe('max-rounds');
		expect(res.summary).toContain('3 Runden ohne Summary');
	});
});

// ─── System prompt customisation ──────────────────────────────────

describe('runSubAgent — system prompt', () => {
	it('uses a type-specific default prompt', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		await runSubAgent({
			...baseInput('research'),
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});
		const seen = llm.calls[0].messages;
		expect(seen[0].content).toContain('research');
	});

	it('honours an explicit systemPrompt override', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		await runSubAgent({
			...baseInput('general'),
			systemPrompt: 'CUSTOM SYSTEM: do exactly X.',
			llm,
			onToolCall: async () => ({ success: true, message: '' }),
		});
		const seen = llm.calls[0].messages;
		expect(seen[0].content).toBe('CUSTOM SYSTEM: do exactly X.');
	});
});

// ─── Model contract ────────────────────────────────────────────────

describe('runSubAgent — model routing', () => {
	it('throws when no model is supplied', async () => {
		const llm = new MockLlmClient();
		await expect(
			runSubAgent({
				...baseInput('research'),
				model: undefined,
				llm,
				onToolCall: async () => ({ success: true, message: '' }),
			})
		).rejects.toThrow(/no model supplied/);
	});
});

// ─── End-to-end: tool executed + summary returned ──────────────────

describe('runSubAgent — end-to-end', () => {
	it('loops: tool call → result → summary', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([{ name: 'list_things', args: {} }])
			.enqueueStop('Found 3 things: a, b, c');

		const onToolCall = vi.fn(
			async (_call: ToolCallRequest): Promise<ToolResult> => ({
				success: true,
				data: ['a', 'b', 'c'],
				message: '3 items',
			})
		);

		const res = await runSubAgent({
			...baseInput('research'),
			llm,
			onToolCall,
		});

		expect(onToolCall).toHaveBeenCalledTimes(1);
		expect(res.summary).toBe('Found 3 things: a, b, c');
		expect(res.rawResult.executedCalls).toHaveLength(1);
	});
});
