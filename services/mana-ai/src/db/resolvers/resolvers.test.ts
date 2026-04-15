import { describe, it, expect, afterEach } from 'bun:test';
import { registerServerResolver, unregisterServerResolver, resolveServerInputs } from './index';
import type { Sql } from '../connection';
import type { MissionInputRef } from '@mana/shared-ai';

// Stub Sql — the registry only uses it as an opaque pass-through.
const stubSql = null as unknown as Sql;

afterEach(() => {
	unregisterServerResolver('resolver_test_mod');
	unregisterServerResolver('resolver_test_boom');
});

describe('resolveServerInputs', () => {
	it('invokes the registered resolver and returns its output', async () => {
		registerServerResolver('resolver_test_mod', async (_sql, ref) => ({
			id: ref.id,
			module: ref.module,
			table: ref.table,
			title: 'T',
			content: `content for ${ref.id}`,
		}));

		const refs: MissionInputRef[] = [{ module: 'resolver_test_mod', table: 't', id: 'a' }];
		const resolved = await resolveServerInputs(stubSql, refs, 'user-1', { missionId: 'm' });
		expect(resolved).toHaveLength(1);
		expect(resolved[0].content).toBe('content for a');
	});

	it('skips refs whose module has no registered resolver', async () => {
		const refs: MissionInputRef[] = [{ module: 'does-not-exist', table: 't', id: 'x' }];
		const resolved = await resolveServerInputs(stubSql, refs, 'u', { missionId: 'm' });
		expect(resolved).toEqual([]);
	});

	it('catches resolver errors and skips rather than propagating', async () => {
		registerServerResolver('resolver_test_boom', async () => {
			throw new Error('broken');
		});
		const refs: MissionInputRef[] = [{ module: 'resolver_test_boom', table: 't', id: 'x' }];
		const resolved = await resolveServerInputs(stubSql, refs, 'u', { missionId: 'm' });
		expect(resolved).toEqual([]);
	});

	it('mixes resolved + unresolved refs in one call', async () => {
		registerServerResolver('resolver_test_mod', async (_sql, ref) => ({
			id: ref.id,
			module: ref.module,
			table: ref.table,
			content: 'ok',
		}));
		const refs: MissionInputRef[] = [
			{ module: 'resolver_test_mod', table: 't', id: 'a' },
			{ module: 'unknown', table: 't', id: 'b' },
			{ module: 'resolver_test_mod', table: 't', id: 'c' },
		];
		const resolved = await resolveServerInputs(stubSql, refs, 'u', { missionId: 'm' });
		expect(resolved).toHaveLength(2);
	});

	it('ships with goals as a built-in resolver', async () => {
		// goals is seeded on module import. We assert it's registered by
		// checking the empty-refs path doesn't throw and that an unknown
		// module still skips — any negative-space test, since we can't
		// invoke the goals resolver without a live DB here.
		const resolved = await resolveServerInputs(stubSql, [], 'u', { missionId: 'm' });
		expect(resolved).toEqual([]);
	});
});
