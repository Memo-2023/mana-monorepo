import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { executeTool } from './executor';
import { registerTools, getTools } from './registry';
import { setAiPolicy } from '../ai/policy';
import { listProposals, approveProposal } from '../ai/proposals/store';
import { PROPOSALS_TABLE } from '../ai/proposals/types';
import { db } from '../database';
import type { Actor } from '../events/actor';
import type { ModuleTool } from './types';

const AI: Actor = { kind: 'ai', missionId: 'm-1', iterationId: 'it-1', rationale: 'because' };

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

describe('Tool Executor — AI policy routing', () => {
	beforeEach(async () => {
		await db.table(PROPOSALS_TABLE).clear();
	});

	it('runs a tool directly for user actors regardless of name', async () => {
		// test_echo has no policy entry — user default is always auto
		const result = await executeTool('test_echo', { text: 'hi' });
		expect(result.success).toBe(true);
		expect(result.message).toBe('echo: hi');
	});

	it('stages a proposal when ai actor hits a propose-policy tool', async () => {
		const restore = setAiPolicy({ tools: { test_echo: 'propose' }, defaultForAi: 'propose' });
		try {
			const result = await executeTool('test_echo', { text: 'stage-me' }, AI);
			expect(result.success).toBe(true);
			expect(result.message).toMatch(/Vorgeschlagen/);
			expect((result.data as { proposalId: string }).proposalId).toBeTruthy();

			// Tool did NOT run — it was staged
			const pending = await listProposals({ status: 'pending' });
			expect(pending).toHaveLength(1);
			expect(pending[0].rationale).toBe('because');
			expect(pending[0].missionId).toBe('m-1');
		} finally {
			restore();
		}
	});

	it('runs directly for ai actor when policy says auto', async () => {
		const restore = setAiPolicy({ tools: { test_echo: 'auto' }, defaultForAi: 'propose' });
		try {
			const result = await executeTool('test_echo', { text: 'direct' }, AI);
			expect(result.success).toBe(true);
			expect(result.message).toBe('echo: direct');
			const pending = await listProposals({ status: 'pending' });
			expect(pending).toHaveLength(0);
		} finally {
			restore();
		}
	});

	it('refuses with deny policy', async () => {
		const restore = setAiPolicy({ tools: { test_echo: 'deny' }, defaultForAi: 'propose' });
		try {
			const result = await executeTool('test_echo', { text: 'no' }, AI);
			expect(result.success).toBe(false);
			expect(result.message).toMatch(/not available/);
		} finally {
			restore();
		}
	});

	it('approval runs the staged intent with original actor attribution', async () => {
		const restore = setAiPolicy({ tools: { test_echo: 'propose' }, defaultForAi: 'propose' });
		try {
			const staged = await executeTool('test_echo', { text: 'approved' }, AI);
			const proposalId = (staged.data as { proposalId: string }).proposalId;

			const { result, proposal } = await approveProposal(proposalId);
			expect(result.success).toBe(true);
			expect(result.message).toBe('echo: approved');
			expect(proposal.status).toBe('approved');
		} finally {
			restore();
		}
	});

	it('still validates parameters before staging a proposal', async () => {
		const restore = setAiPolicy({ tools: { test_echo: 'propose' }, defaultForAi: 'propose' });
		try {
			const result = await executeTool('test_echo', {}, AI);
			expect(result.success).toBe(false);
			expect(result.message).toContain('Missing required parameter');
			const pending = await listProposals({ status: 'pending' });
			expect(pending).toHaveLength(0);
		} finally {
			restore();
		}
	});
});
