import { describe, expect, it, vi } from 'vitest';
import { TASK_TOOL_NAME, TASK_TOOL_SCHEMA, createTaskToolHandler } from './task-tool';
import { MAX_SUB_AGENT_DEPTH } from './sub-agent';
import { MockLlmClient } from './mock-llm';
import type { ToolCallRequest, ToolResult } from './loop';
import type { ToolSchema } from '../tools/schemas';

const parentTools: ToolSchema[] = [
	{
		name: 'list_things',
		module: 'test',
		description: 'read',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'create_thing',
		module: 'test',
		description: 'write',
		defaultPolicy: 'propose',
		parameters: [{ name: 'title', type: 'string', description: 't', required: true }],
	},
];

function makeCall(args: Record<string, unknown>): ToolCallRequest {
	return { id: 'tc-1', name: TASK_TOOL_NAME, arguments: args };
}

// ─── Schema shape ──────────────────────────────────────────────────

describe('TASK_TOOL_SCHEMA', () => {
	it('is named "task"', () => {
		expect(TASK_TOOL_SCHEMA.name).toBe('task');
		expect(TASK_TOOL_NAME).toBe('task');
	});

	it('carries subagent_type enum with research/plan/general', () => {
		const typeParam = TASK_TOOL_SCHEMA.parameters.find((p) => p.name === 'subagent_type');
		expect(typeParam).toBeDefined();
		expect(typeParam!.enum).toEqual(['research', 'plan', 'general']);
	});

	it('requires description + prompt + subagent_type', () => {
		const required = TASK_TOOL_SCHEMA.parameters.filter((p) => p.required).map((p) => p.name);
		expect(required).toEqual(['subagent_type', 'description', 'prompt']);
	});

	it('defaultPolicy is auto (control-flow primitive, not a write)', () => {
		expect(TASK_TOOL_SCHEMA.defaultPolicy).toBe('auto');
	});
});

// ─── Recursion rejection ───────────────────────────────────────────

describe('createTaskToolHandler — recursion', () => {
	it('refuses when parentDepth is at the cap (structured error, not throw)', async () => {
		const handler = createTaskToolHandler({
			llm: new MockLlmClient(),
			model: 'x/y',
			parentDepth: MAX_SUB_AGENT_DEPTH,
			parentTools,
			parentOnToolCall: async () => ({ success: true, message: '' }),
		});

		const res = await handler.handle(
			makeCall({ subagent_type: 'research', description: 'nested', prompt: 'do it' })
		);
		expect(res.success).toBe(false);
		expect(res.message).toContain('nicht verschachtelt');
	});
});

// ─── Input validation ──────────────────────────────────────────────

describe('createTaskToolHandler — argument validation', () => {
	function make() {
		return createTaskToolHandler({
			llm: new MockLlmClient(),
			model: 'x/y',
			parentDepth: 0,
			parentTools,
			parentOnToolCall: async () => ({ success: true, message: '' }),
		});
	}

	it('rejects non-object args', async () => {
		const res = await make().handle({
			id: 't',
			name: 'task',
			arguments: null as unknown as Record<string, unknown>,
		});
		expect(res.success).toBe(false);
		expect(res.message).toContain('object');
	});

	it('rejects invalid subagent_type', async () => {
		const res = await make().handle(
			makeCall({ subagent_type: 'evil', description: 'x', prompt: 'y' })
		);
		expect(res.success).toBe(false);
		expect(res.message).toContain('research|plan|general');
	});

	it('rejects empty description', async () => {
		const res = await make().handle(
			makeCall({ subagent_type: 'research', description: '', prompt: 'y' })
		);
		expect(res.success).toBe(false);
		expect(res.message).toContain('description');
	});

	it('rejects empty prompt', async () => {
		const res = await make().handle(
			makeCall({ subagent_type: 'research', description: 'x', prompt: '' })
		);
		expect(res.success).toBe(false);
		expect(res.message).toContain('prompt');
	});
});

// ─── Happy path ────────────────────────────────────────────────────

describe('createTaskToolHandler — happy path', () => {
	it('spawns a sub-agent and returns its summary as ToolResult.message', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([{ name: 'list_things', args: {} }])
			.enqueueStop('Found 2 items: a, b');

		const parentDispatch = vi.fn(
			async (_c: ToolCallRequest): Promise<ToolResult> => ({
				success: true,
				data: ['a', 'b'],
				message: '2 items',
			})
		);

		const handler = createTaskToolHandler({
			llm,
			model: 'google/gemini-2.5-flash-lite',
			parentDepth: 0,
			parentTools,
			parentOnToolCall: parentDispatch,
		});

		const res = await handler.handle(
			makeCall({
				subagent_type: 'research',
				description: 'scan things',
				prompt: 'list everything and report back',
			})
		);

		expect(res.success).toBe(true);
		expect(res.message).toBe('Found 2 items: a, b');

		const data = res.data as {
			subAgentType: string;
			toolsCalled: number;
			rounds: number;
			stopReason: string;
		};
		expect(data.subAgentType).toBe('research');
		expect(data.toolsCalled).toBe(1);
		expect(data.rounds).toBeGreaterThanOrEqual(2);
		expect(parentDispatch).toHaveBeenCalledTimes(1);
	});

	it('tracks cumulative usage across multiple invocations', async () => {
		const llm = new MockLlmClient();
		// Two sub-agent runs, each reports usage.
		for (let i = 0; i < 2; i++) {
			(llm as unknown as { queue: unknown[] }).queue.push({
				content: `summary-${i}`,
				toolCalls: [],
				finishReason: 'stop',
				usage: { promptTokens: 100, completionTokens: 30, totalTokens: 130 },
			});
		}

		const handler = createTaskToolHandler({
			llm,
			model: 'google/gemini-2.5-flash-lite',
			parentDepth: 0,
			parentTools,
			parentOnToolCall: async () => ({ success: true, message: '' }),
		});

		await handler.handle(makeCall({ subagent_type: 'plan', description: 'a', prompt: 'one' }));
		await handler.handle(makeCall({ subagent_type: 'plan', description: 'b', prompt: 'two' }));

		expect(handler.invocationCount()).toBe(2);
		const usage = handler.cumulativeUsage();
		expect(usage.promptTokens).toBe(200);
		expect(usage.completionTokens).toBe(60);
		expect(usage.totalTokens).toBe(260);
	});

	it('counts zero usage if no successful sub-agent ran', async () => {
		const handler = createTaskToolHandler({
			llm: new MockLlmClient(),
			model: 'x/y',
			parentDepth: 0,
			parentTools,
			parentOnToolCall: async () => ({ success: true, message: '' }),
		});
		expect(handler.invocationCount()).toBe(0);
		expect(handler.cumulativeUsage()).toEqual({
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0,
		});
	});

	it('wraps sub-agent exceptions as structured ToolResult failures', async () => {
		const llm = {
			async complete() {
				throw new Error('provider is down');
			},
		};

		const handler = createTaskToolHandler({
			llm,
			model: 'x/y',
			parentDepth: 0,
			parentTools,
			parentOnToolCall: async () => ({ success: true, message: '' }),
		});

		const res = await handler.handle(
			makeCall({ subagent_type: 'general', description: 'x', prompt: 'y' })
		);
		expect(res.success).toBe(false);
		expect(res.message).toContain('Sub-agent failed');
		expect(res.message).toContain('provider is down');
	});
});

// ─── Tool-routing through parent dispatcher ────────────────────────

describe('createTaskToolHandler — tool routing', () => {
	it('sub-agent tool calls route through parent dispatcher (policy/audit stays reused)', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([{ name: 'list_things', args: {} }])
			.enqueueStop('summary');

		let parentCalled = false;
		const parentDispatch = async (_c: ToolCallRequest): Promise<ToolResult> => {
			parentCalled = true;
			return { success: true, message: 'from parent' };
		};

		const handler = createTaskToolHandler({
			llm,
			model: 'x/y',
			parentDepth: 0,
			parentTools,
			parentOnToolCall: parentDispatch,
		});

		await handler.handle(makeCall({ subagent_type: 'research', description: 'd', prompt: 'p' }));

		expect(parentCalled).toBe(true);
	});
});
