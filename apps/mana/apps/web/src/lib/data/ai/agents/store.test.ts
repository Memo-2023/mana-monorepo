import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mirror the existing ai/* test suite mocks: funnel-tracking + the
// triggers registry touch browser-only globals at import time.
vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));
import { db } from '../../database';
import {
	createAgent,
	updateAgent,
	deleteAgent,
	archiveAgent,
	getAgent,
	listAgents,
	findByName,
	getOrCreateAgent,
	DuplicateAgentNameError,
} from './store';
import { AGENTS_TABLE, DEFAULT_AGENT_ID, DEFAULT_AGENT_NAME } from './types';

beforeEach(async () => {
	await db.table(AGENTS_TABLE).clear();
});

describe('createAgent', () => {
	it('inserts an agent with sane defaults', async () => {
		const a = await createAgent({ name: 'Travel Planner', role: 'plans trips' });
		expect(a.id).toBeTruthy();
		expect(a.state).toBe('active');
		expect(a.maxConcurrentMissions).toBe(1);
		expect(a.policy).toBeDefined();
	});

	it('refuses duplicate names among non-deleted agents', async () => {
		await createAgent({ name: 'Dup', role: 'x' });
		await expect(createAgent({ name: 'Dup', role: 'y' })).rejects.toBeInstanceOf(
			DuplicateAgentNameError
		);
	});

	it('allows reusing a name after the clashing agent is soft-deleted', async () => {
		const first = await createAgent({ name: 'Zombie', role: 'first' });
		await deleteAgent(first.id);
		const second = await createAgent({ name: 'Zombie', role: 'second' });
		expect(second.id).not.toBe(first.id);
		expect(second.role).toBe('second');
	});
});

describe('getOrCreateAgent', () => {
	it('creates on first call, returns existing on second', async () => {
		const a = await getOrCreateAgent({
			id: DEFAULT_AGENT_ID,
			name: DEFAULT_AGENT_NAME,
			role: 'default',
		});
		const b = await getOrCreateAgent({
			id: DEFAULT_AGENT_ID,
			name: DEFAULT_AGENT_NAME,
			role: 'default',
		});
		expect(a.id).toBe(DEFAULT_AGENT_ID);
		expect(b.id).toBe(a.id);
		const all = await listAgents();
		expect(all).toHaveLength(1);
	});
});

describe('updateAgent', () => {
	it('applies a patch and refreshes updatedAt', async () => {
		const a = await createAgent({ name: 'Edit me', role: 'r' });
		await updateAgent(a.id, { role: 'new role' });
		const after = await getAgent(a.id);
		expect(after?.role).toBe('new role');
	});

	it('refuses to rename into a clashing existing name', async () => {
		await createAgent({ name: 'Taken', role: 'x' });
		const mover = await createAgent({ name: 'Original', role: 'y' });
		await expect(updateAgent(mover.id, { name: 'Taken' })).rejects.toBeInstanceOf(
			DuplicateAgentNameError
		);
	});

	it("allows renaming to the agent's own current name (no-op)", async () => {
		const a = await createAgent({ name: 'Stable', role: 'x' });
		await expect(updateAgent(a.id, { name: 'Stable' })).resolves.toBeUndefined();
	});
});

describe('listAgents + findByName', () => {
	it('lists only non-deleted agents, newest first', async () => {
		await createAgent({ name: 'A', role: 'x' });
		await new Promise((r) => setTimeout(r, 2));
		const b = await createAgent({ name: 'B', role: 'y' });
		await deleteAgent(b.id);
		await new Promise((r) => setTimeout(r, 2));
		await createAgent({ name: 'C', role: 'z' });
		const list = await listAgents();
		expect(list.map((a) => a.name)).toEqual(['C', 'A']);
	});

	it('filters by state when requested', async () => {
		const a = await createAgent({ name: 'Active', role: 'x' });
		const b = await createAgent({ name: 'Paused', role: 'y' });
		await archiveAgent(b.id);
		const activeOnly = await listAgents({ state: 'active' });
		expect(activeOnly.map((x) => x.id)).toEqual([a.id]);
	});

	it('findByName returns the matching non-deleted row', async () => {
		await createAgent({ name: 'Needle', role: 'x' });
		expect((await findByName('Needle'))?.name).toBe('Needle');
		expect(await findByName('Nope')).toBeUndefined();
	});
});
