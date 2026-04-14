import { describe, it, expect } from 'vitest';
import { resolvePolicy, setAiPolicy, DEFAULT_AI_POLICY } from './policy';
import { registerTools } from '../tools/registry';
import { AI_PROPOSABLE_TOOL_NAMES } from '@mana/shared-ai';
import type { Actor } from '../events/actor';

const AI: Actor = { kind: 'ai', missionId: 'm', iterationId: 'i', rationale: 'r' };
const USER: Actor = { kind: 'user' };
const SYSTEM: Actor = { kind: 'system', source: 'projection' };

describe('resolvePolicy', () => {
	it('always returns auto for user actors', () => {
		expect(resolvePolicy('create_task', USER)).toBe('auto');
		expect(resolvePolicy('anything', USER)).toBe('auto');
	});

	it('always returns auto for system actors', () => {
		expect(resolvePolicy('create_task', SYSTEM)).toBe('auto');
	});

	it('uses per-tool entries for ai actors', () => {
		expect(resolvePolicy('create_task', AI)).toBe('propose');
		expect(resolvePolicy('get_task_stats', AI)).toBe('auto');
		expect(resolvePolicy('log_drink', AI)).toBe('auto');
	});

	it('falls back to the global ai default when no entry matches', () => {
		expect(resolvePolicy('unregistered_tool', AI)).toBe(DEFAULT_AI_POLICY.defaultForAi);
	});

	it('uses module defaults when configured and no per-tool entry exists', () => {
		registerTools([
			{
				name: 'policy_test_custom',
				module: 'policyTest',
				description: 'd',
				parameters: [],
				async execute() {
					return { success: true, message: 'ok' };
				},
			},
		]);
		const restore = setAiPolicy({
			tools: {},
			defaultsByModule: { policyTest: 'deny' },
			defaultForAi: 'auto',
		});
		try {
			expect(resolvePolicy('policy_test_custom', AI)).toBe('deny');
		} finally {
			restore();
		}
	});

	it('setAiPolicy returns a restorer', () => {
		const restore = setAiPolicy({ tools: {}, defaultForAi: 'deny' });
		expect(resolvePolicy('create_task', AI)).toBe('deny');
		restore();
		expect(resolvePolicy('create_task', AI)).toBe('propose');
	});

	it('every shared-ai proposable tool maps to propose in DEFAULT_AI_POLICY', () => {
		for (const name of AI_PROPOSABLE_TOOL_NAMES) {
			expect(DEFAULT_AI_POLICY.tools[name], `${name} should be 'propose'`).toBe('propose');
		}
	});
});
