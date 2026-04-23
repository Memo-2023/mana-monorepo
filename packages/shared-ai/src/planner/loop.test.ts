import { describe, expect, it, vi } from 'vitest';
import { runPlannerLoop, type ToolCallRequest, type ToolResult } from './loop';
import { MockLlmClient } from './mock-llm';
import type { ToolSchema } from '../tools/schemas';

const tools: ToolSchema[] = [
	{
		name: 'list_things',
		module: 'test',
		description: 'list things',
		defaultPolicy: 'auto',
		parameters: [],
	},
	{
		name: 'create_thing',
		module: 'test',
		description: 'create a thing',
		defaultPolicy: 'propose',
		parameters: [{ name: 'title', type: 'string', description: 'title', required: true }],
	},
];

describe('runPlannerLoop', () => {
	it('stops immediately when the LLM emits no tool_calls', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		const onToolCall = vi.fn();
		const result = await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'test/model',
			},
			onToolCall,
		});
		expect(result.rounds).toBe(1);
		expect(result.executedCalls).toHaveLength(0);
		expect(result.summary).toBe('done');
		expect(result.stopReason).toBe('assistant-stop');
		expect(onToolCall).not.toHaveBeenCalled();
	});

	it('executes a single tool call and feeds the result back', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([{ name: 'list_things', args: {} }])
			.enqueueStop('all done');

		const onToolCall = vi.fn(
			async (_call: ToolCallRequest): Promise<ToolResult> => ({
				success: true,
				data: ['a', 'b'],
				message: '2 things',
			})
		);

		const result = await runPlannerLoop({
			llm,
			input: { systemPrompt: 's', userPrompt: 'u', tools, model: 'm' },
			onToolCall,
		});

		expect(result.rounds).toBe(2);
		expect(result.executedCalls).toHaveLength(1);
		expect(result.executedCalls[0].call.name).toBe('list_things');
		expect(result.summary).toBe('all done');
		expect(result.stopReason).toBe('assistant-stop');

		// Second LLM call must have seen the tool result in its messages.
		expect(llm.calls[1].messages).toHaveLength(4); // system + user + assistant + tool
		const toolMsg = llm.calls[1].messages[3];
		expect(toolMsg.role).toBe('tool');
		expect(toolMsg.content).toContain('2 things');
	});

	it('executes parallel tool calls sequentially', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([
				{ name: 'create_thing', args: { title: 'a' } },
				{ name: 'create_thing', args: { title: 'b' } },
				{ name: 'create_thing', args: { title: 'c' } },
			])
			.enqueueStop();

		const executedInOrder: string[] = [];
		const onToolCall = async (call: ToolCallRequest): Promise<ToolResult> => {
			executedInOrder.push(call.arguments.title as string);
			return { success: true, message: 'ok' };
		};

		const result = await runPlannerLoop({
			llm,
			input: { systemPrompt: 's', userPrompt: 'u', tools, model: 'm' },
			onToolCall,
		});

		expect(executedInOrder).toEqual(['a', 'b', 'c']);
		expect(result.executedCalls).toHaveLength(3);
	});

	it('propagates tool failures as tool-messages (LLM can react)', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([{ name: 'list_things', args: {} }])
			.enqueueStop('ack');

		const onToolCall = async (): Promise<ToolResult> => ({
			success: false,
			message: 'db locked',
		});

		const result = await runPlannerLoop({
			llm,
			input: { systemPrompt: 's', userPrompt: 'u', tools, model: 'm' },
			onToolCall,
		});

		const toolMsg = llm.calls[1].messages[3];
		expect(toolMsg.content).toContain('db locked');
		expect(toolMsg.content).toContain('"success":false');
		expect(result.executedCalls[0].result.success).toBe(false);
	});

	it('honours the maxRounds ceiling', async () => {
		const llm = new MockLlmClient();
		// Seed enough tool-call turns to exceed the cap
		for (let i = 0; i < 10; i++) {
			llm.enqueueToolCalls([{ name: 'list_things', args: {} }]);
		}
		const onToolCall = async (): Promise<ToolResult> => ({
			success: true,
			message: 'ok',
		});

		const result = await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				maxRounds: 3,
			},
			onToolCall,
		});

		expect(result.rounds).toBe(3);
		expect(result.stopReason).toBe('max-rounds');
		expect(result.executedCalls).toHaveLength(3);
	});
});

describe('runPlannerLoop — parallel reads', () => {
	it('runs a batch of parallel-safe tools via Promise.all', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([
				{ name: 'list_things', args: { i: 1 } },
				{ name: 'list_things', args: { i: 2 } },
				{ name: 'list_things', args: { i: 3 } },
			])
			.enqueueStop();

		let concurrent = 0;
		let peakConcurrent = 0;
		let completed = 0;
		const onToolCall = async (_call: ToolCallRequest): Promise<ToolResult> => {
			concurrent++;
			peakConcurrent = Math.max(peakConcurrent, concurrent);
			await new Promise((r) => setTimeout(r, 10));
			concurrent--;
			completed++;
			return { success: true, message: `done-${completed}` };
		};

		await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				isParallelSafe: (name) => name === 'list_things',
			},
			onToolCall,
		});

		// All three ran concurrently — peak should be 3, not 1.
		expect(peakConcurrent).toBe(3);
	});

	it('preserves source order in messages despite parallel completion', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([
				{ name: 'list_things', args: { i: 'a' } },
				{ name: 'list_things', args: { i: 'b' } },
				{ name: 'list_things', args: { i: 'c' } },
			])
			.enqueueStop();

		// Reverse completion order: first call finishes last.
		const delays: Record<string, number> = { a: 30, b: 10, c: 1 };
		const onToolCall = async (call: ToolCallRequest): Promise<ToolResult> => {
			const i = call.arguments.i as string;
			await new Promise((r) => setTimeout(r, delays[i]));
			return { success: true, message: `item-${i}` };
		};

		const result = await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				isParallelSafe: () => true,
			},
			onToolCall,
		});

		// executedCalls follows source order
		expect(result.executedCalls.map((ec) => ec.call.arguments.i)).toEqual(['a', 'b', 'c']);

		// Tool messages on the NEXT LLM call are in source order too
		const toolMsgs = llm.calls[1].messages.filter((m) => m.role === 'tool');
		expect(toolMsgs.map((m) => m.content)).toEqual([
			expect.stringContaining('item-a'),
			expect.stringContaining('item-b'),
			expect.stringContaining('item-c'),
		]);
	});

	it('falls back to sequential when any call is not parallel-safe', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([
				{ name: 'list_things', args: {} },
				{ name: 'create_thing', args: { title: 'x' } }, // unsafe
				{ name: 'list_things', args: {} },
			])
			.enqueueStop();

		let concurrent = 0;
		let peakConcurrent = 0;
		const onToolCall = async (): Promise<ToolResult> => {
			concurrent++;
			peakConcurrent = Math.max(peakConcurrent, concurrent);
			await new Promise((r) => setTimeout(r, 5));
			concurrent--;
			return { success: true, message: 'ok' };
		};

		await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				isParallelSafe: (name) => name === 'list_things',
			},
			onToolCall,
		});

		// Mixed batch ran sequentially — peak concurrency stayed at 1.
		expect(peakConcurrent).toBe(1);
	});

	it('batches more than PARALLEL_TOOL_BATCH_SIZE calls', async () => {
		const N = 15; // > 10-call ceiling
		const llm = new MockLlmClient()
			.enqueueToolCalls(Array.from({ length: N }, (_, i) => ({ name: 'list_things', args: { i } })))
			.enqueueStop();

		let concurrent = 0;
		let peakConcurrent = 0;
		const onToolCall = async (): Promise<ToolResult> => {
			concurrent++;
			peakConcurrent = Math.max(peakConcurrent, concurrent);
			await new Promise((r) => setTimeout(r, 15));
			concurrent--;
			return { success: true, message: 'ok' };
		};

		const result = await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				isParallelSafe: () => true,
			},
			onToolCall,
		});

		// Capped at the batch size — the 11th onwards had to wait.
		expect(peakConcurrent).toBeLessThanOrEqual(10);
		// All still executed, all in source order.
		expect(result.executedCalls).toHaveLength(N);
		expect(result.executedCalls.map((ec) => ec.call.arguments.i)).toEqual(
			Array.from({ length: N }, (_, i) => i)
		);
	});

	it('stays sequential when isParallelSafe is not provided (pre-M1 default)', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([
				{ name: 'list_things', args: {} },
				{ name: 'list_things', args: {} },
			])
			.enqueueStop();

		let concurrent = 0;
		let peakConcurrent = 0;
		const onToolCall = async (): Promise<ToolResult> => {
			concurrent++;
			peakConcurrent = Math.max(peakConcurrent, concurrent);
			await new Promise((r) => setTimeout(r, 5));
			concurrent--;
			return { success: true, message: 'ok' };
		};

		await runPlannerLoop({
			llm,
			input: { systemPrompt: 's', userPrompt: 'u', tools, model: 'm' },
			onToolCall,
		});

		expect(peakConcurrent).toBe(1);
	});
});

describe('runPlannerLoop — reminderChannel', () => {
	it('injects reminders as transient system messages on the LLM call', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		const result = await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				reminderChannel: () => ['budget 80%', 'mission overdue'],
			},
			onToolCall: vi.fn(),
		});

		// The request messages the mock saw must include the reminders
		// AFTER the user turn, each wrapped in <reminder> tags.
		const seenByLlm = llm.calls[0].messages;
		expect(seenByLlm).toHaveLength(4); // system + user + 2 reminders
		expect(seenByLlm[0].role).toBe('system');
		expect(seenByLlm[0].content).toBe('s');
		expect(seenByLlm[1].role).toBe('user');
		expect(seenByLlm[2].role).toBe('system');
		expect(seenByLlm[2].content).toBe('<reminder>budget 80%</reminder>');
		expect(seenByLlm[3].role).toBe('system');
		expect(seenByLlm[3].content).toBe('<reminder>mission overdue</reminder>');

		// And the persisted history must NOT contain them.
		expect(result.messages.find((m) => m.content?.includes('<reminder>'))).toBeUndefined();
	});

	it('is called per round with fresh state — round 2 does not see round 1 reminders', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([{ name: 'list_things', args: {} }])
			.enqueueStop('done');

		const channelCalls: Array<{ round: number; reminders: string[] }> = [];
		const channel = vi.fn((state) => {
			const reminders = [`round-${state.round}`];
			channelCalls.push({ round: state.round, reminders });
			return reminders;
		});

		await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				reminderChannel: channel,
			},
			onToolCall: async () => ({ success: true, message: 'ok' }),
		});

		expect(channel).toHaveBeenCalledTimes(2);
		expect(channelCalls).toEqual([
			{ round: 1, reminders: ['round-1'] },
			{ round: 2, reminders: ['round-2'] },
		]);

		// Round 2's request must have ONLY round-2's reminder, not round-1's.
		const round2Seen = llm.calls[1].messages;
		const reminders = round2Seen.filter((m) => m.content?.includes('<reminder>'));
		expect(reminders).toHaveLength(1);
		expect(reminders[0].content).toBe('<reminder>round-2</reminder>');
	});

	it('surfaces loop state — toolCallCount and lastCall — to the channel', async () => {
		const llm = new MockLlmClient()
			.enqueueToolCalls([{ name: 'list_things', args: {} }])
			.enqueueToolCalls([{ name: 'create_thing', args: { title: 'x' } }])
			.enqueueStop('done');

		const snapshots: Array<{ round: number; toolCallCount: number; lastName?: string }> = [];
		await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				reminderChannel: (state) => {
					snapshots.push({
						round: state.round,
						toolCallCount: state.toolCallCount,
						lastName: state.lastCall?.call.name,
					});
					return [];
				},
			},
			onToolCall: async () => ({ success: true, message: 'ok' }),
		});

		expect(snapshots).toEqual([
			{ round: 1, toolCallCount: 0, lastName: undefined },
			{ round: 2, toolCallCount: 1, lastName: 'list_things' },
			{ round: 3, toolCallCount: 2, lastName: 'create_thing' },
		]);
	});

	it('empty reminders array leaves the request unchanged', async () => {
		const llm = new MockLlmClient().enqueueStop('done');
		await runPlannerLoop({
			llm,
			input: {
				systemPrompt: 's',
				userPrompt: 'u',
				tools,
				model: 'm',
				reminderChannel: () => [],
			},
			onToolCall: vi.fn(),
		});

		const seenByLlm = llm.calls[0].messages;
		expect(seenByLlm).toHaveLength(2); // just system + user
	});
});
