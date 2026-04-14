import { describe, it, expect } from 'vitest';
import { parsePlannerResponse } from './parser';
import { buildPlannerPrompt } from './prompt';
import type { AiPlanInput } from './types';
import type { Mission } from '../missions/types';

const TOOLS = new Set(['create_task']);

function mission(): Mission {
	return {
		id: 'm',
		createdAt: '2026-04-14T00:00:00Z',
		updatedAt: '2026-04-14T00:00:00Z',
		title: 'Test',
		conceptMarkdown: '',
		objective: 'x',
		inputs: [],
		cadence: { kind: 'manual' },
		state: 'active',
		iterations: [],
	};
}

describe('shared-ai planner', () => {
	it('prompt + parser round-trip a valid plan', () => {
		const input: AiPlanInput = {
			mission: mission(),
			resolvedInputs: [],
			availableTools: [
				{
					name: 'create_task',
					module: 'todo',
					description: 'Creates a task',
					parameters: [{ name: 'title', type: 'string', required: true, description: 'Title' }],
				},
			],
		};
		const { system } = buildPlannerPrompt(input);
		expect(system).toContain('create_task');

		const response = `\`\`\`json
{
  "summary": "test",
  "steps": [
    { "summary": "s", "toolName": "create_task", "params": { "title": "x" }, "rationale": "why" }
  ]
}
\`\`\``;
		const r = parsePlannerResponse(response, TOOLS);
		expect(r.ok).toBe(true);
	});

	it('rejects unknown tool names', () => {
		const r = parsePlannerResponse(
			`{"summary":"","steps":[{"toolName":"delete_everything","params":{},"rationale":"lol"}]}`,
			TOOLS
		);
		expect(r.ok).toBe(false);
	});
});
