import { describe, it, expect, afterEach, vi } from 'vitest';

// Mock the heavy deps so this is a pure scheduler test — we don't exercise
// the orchestrator or Dexie from here; those are covered by runner.test.ts.
vi.mock('@mana/shared-llm', () => ({
	llmOrchestrator: {
		run: vi.fn().mockResolvedValue({ value: { summary: '', steps: [] } }),
	},
}));
vi.mock('./runner', () => ({
	runDueMissions: vi.fn().mockResolvedValue([]),
}));
vi.mock('./default-resolvers', () => ({
	registerDefaultInputResolvers: vi.fn(),
}));

import { startMissionTick, stopMissionTick, isMissionTickRunning } from './setup';
import { runDueMissions } from './runner';
import { registerDefaultInputResolvers } from './default-resolvers';

afterEach(() => {
	stopMissionTick();
	vi.clearAllMocks();
});

describe('mission tick scheduler', () => {
	it('starts, runs once immediately, and schedules an interval', async () => {
		vi.useFakeTimers();
		try {
			startMissionTick(5_000);
			expect(isMissionTickRunning()).toBe(true);
			expect(registerDefaultInputResolvers).toHaveBeenCalledOnce();

			// Wait for the immediate run to complete
			await vi.advanceTimersByTimeAsync(1);
			expect(runDueMissions).toHaveBeenCalledTimes(1);

			// Advance past one interval — should tick again
			await vi.advanceTimersByTimeAsync(5_000);
			expect(runDueMissions).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
		}
	});

	it('is idempotent — double-start does not schedule two intervals', () => {
		startMissionTick(10_000);
		startMissionTick(10_000);
		expect(isMissionTickRunning()).toBe(true);
	});

	it('stop clears the interval', () => {
		startMissionTick(10_000);
		expect(isMissionTickRunning()).toBe(true);
		stopMissionTick();
		expect(isMissionTickRunning()).toBe(false);
	});
});
