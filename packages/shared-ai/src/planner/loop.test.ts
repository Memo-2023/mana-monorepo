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
