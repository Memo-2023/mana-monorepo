import { describe, it, expect, beforeEach } from 'vitest';
import { executeTool } from './executor';
import { registerTools, getTools } from './registry';
import type { ModuleTool } from './types';

// Reset registry between tests by reloading — registry uses module-level array
// Instead, we just register test tools and rely on dedup
const testTools: ModuleTool[] = [
	{
		name: 'test_echo',
		module: 'test',
		description: 'Echoes params back',
		parameters: [
			{ name: 'text', type: 'string', description: 'Text', required: true },
			{ name: 'count', type: 'number', description: 'Count', required: false },
		],
		async execute(params) {
			return { success: true, message: `echo: ${params.text}`, data: params };
		},
	},
	{
		name: 'test_enum',
		module: 'test',
		description: 'Validates enum',
		parameters: [
			{
				name: 'color',
				type: 'string',
				description: 'Color',
				required: true,
				enum: ['red', 'green', 'blue'],
			},
		],
		async execute(params) {
			return { success: true, message: `color: ${params.color}` };
		},
	},
	{
		name: 'test_error',
		module: 'test',
		description: 'Throws',
		parameters: [],
		async execute() {
			throw new Error('intentional');
		},
	},
];

beforeEach(() => {
	registerTools(testTools);
});

describe('Tool Executor', () => {
	it('executes a valid tool call', async () => {
		const result = await executeTool('test_echo', { text: 'hello' });
		expect(result.success).toBe(true);
		expect(result.message).toBe('echo: hello');
		expect((result.data as Record<string, unknown>).text).toBe('hello');
	});

	it('returns error for unknown tool', async () => {
		const result = await executeTool('nonexistent', {});
		expect(result.success).toBe(false);
		expect(result.message).toContain('Unknown tool');
	});

	it('returns error for missing required parameter', async () => {
		const result = await executeTool('test_echo', {});
		expect(result.success).toBe(false);
		expect(result.message).toContain('Missing required parameter: text');
	});

	it('coerces string to number', async () => {
		const result = await executeTool('test_echo', { text: 'hi', count: '42' });
		expect(result.success).toBe(true);
		expect((result.data as Record<string, unknown>).count).toBe(42);
	});

	it('returns error for invalid number coercion', async () => {
		const result = await executeTool('test_echo', { text: 'hi', count: 'abc' });
		expect(result.success).toBe(false);
		expect(result.message).toContain('must be a number');
	});

	it('validates enum values', async () => {
		const result = await executeTool('test_enum', { color: 'red' });
		expect(result.success).toBe(true);

		const bad = await executeTool('test_enum', { color: 'purple' });
		expect(bad.success).toBe(false);
		expect(bad.message).toContain('must be one of');
	});

	it('catches execution errors gracefully', async () => {
		const result = await executeTool('test_error', {});
		expect(result.success).toBe(false);
		expect(result.message).toContain('intentional');
	});

	it('allows optional parameters to be omitted', async () => {
		const result = await executeTool('test_echo', { text: 'only required' });
		expect(result.success).toBe(true);
	});
});
