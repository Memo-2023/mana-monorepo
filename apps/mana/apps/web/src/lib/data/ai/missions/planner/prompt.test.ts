import { describe, it, expect } from 'vitest';
import { buildPlannerPrompt } from './prompt';
import type { AiPlanInput } from './types';
import type { Mission } from '../types';

function baseMission(overrides: Partial<Mission> = {}): Mission {
	return {
		id: 'm-1',
		createdAt: '2026-04-14T10:00:00.000Z',
		updatedAt: '2026-04-14T10:00:00.000Z',
		title: 'Weekly review',
		conceptMarkdown: '# Concept\nDo a thing.',
		objective: 'Review progress each Monday',
		inputs: [],
		cadence: { kind: 'weekly', dayOfWeek: 1, atHour: 9 },
		state: 'active',
		iterations: [],
		...overrides,
	};
}

describe('buildPlannerPrompt', () => {
	it('emits system + user messages with mission title and objective', () => {
		const input: AiPlanInput = {
			mission: baseMission(),
			resolvedInputs: [],
			availableTools: [],
		};
		const { system, user } = buildPlannerPrompt(input);
		expect(user).toContain('Weekly review');
		expect(user).toContain('Review progress each Monday');
		expect(system).toContain('JSON');
		expect(system).toContain('rationale');
	});

	it('lists available tools with their params in the system prompt', () => {
		const input: AiPlanInput = {
			mission: baseMission(),
			resolvedInputs: [],
			availableTools: [
				{
					name: 'create_task',
					module: 'todo',
					description: 'Creates a task',
					parameters: [
						{ name: 'title', type: 'string', required: true, description: 'Task title' },
						{
							name: 'priority',
							type: 'string',
							required: false,
							description: 'prio',
							enum: ['low', 'high'],
						},
					],
				},
			],
		};
		const { system } = buildPlannerPrompt(input);
		expect(system).toContain('create_task');
		expect(system).toContain('title');
		expect(system).toContain('(required)');
		expect(system).toContain('[low|high]');
	});

	it('injects resolved input content into the user prompt', () => {
		const input: AiPlanInput = {
			mission: baseMission({
				inputs: [{ module: 'notes', table: 'notes', id: 'n-1' }],
			}),
			resolvedInputs: [
				{ id: 'n-1', module: 'notes', table: 'notes', title: 'Strategy', content: 'Be bold.' },
			],
			availableTools: [],
		};
		const { user } = buildPlannerPrompt(input);
		expect(user).toContain('Strategy');
		expect(user).toContain('Be bold.');
	});

	it('includes user feedback from the most recent iteration', () => {
		const input: AiPlanInput = {
			mission: baseMission({
				iterations: [
					{
						id: 'it-1',
						startedAt: '2026-04-07T09:00:00.000Z',
						finishedAt: '2026-04-07T09:01:00.000Z',
						plan: [
							{
								id: 's-1',
								summary: 'Old step',
								intent: { kind: 'toolCall', toolName: 'create_task', params: {} },
								status: 'rejected',
							},
						],
						userFeedback: 'Zu aggressiv — bitte zurücknehmen',
						overallStatus: 'rejected',
					},
				],
			}),
			resolvedInputs: [],
			availableTools: [],
		};
		const { user } = buildPlannerPrompt(input);
		expect(user).toContain('Zu aggressiv');
		expect(user).toContain('[rejected]');
	});

	it('truncates iteration history to the last 3', () => {
		const many = Array.from({ length: 10 }, (_, i) => ({
			id: `it-${i}`,
			startedAt: `2026-04-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
			plan: [],
			overallStatus: 'approved' as const,
			userFeedback: `feedback-${i}`,
		}));
		const { user } = buildPlannerPrompt({
			mission: baseMission({ iterations: many }),
			resolvedInputs: [],
			availableTools: [],
		});
		// Only the last three iterations (7, 8, 9) should be present
		expect(user).toContain('feedback-9');
		expect(user).toContain('feedback-7');
		expect(user).not.toContain('feedback-5');
	});
});
