import { describe, it, expect, afterEach } from 'vitest';
import {
	registerInputIndexer,
	unregisterInputIndexer,
	listIndexedModules,
	getInputCandidates,
} from './input-index';

afterEach(() => {
	unregisterInputIndexer('index_test_mod');
	unregisterInputIndexer('index_test_boom');
});

describe('input-index registry', () => {
	it('lists registered modules sorted', () => {
		registerInputIndexer('index_test_mod', async () => []);
		expect(listIndexedModules()).toContain('index_test_mod');
	});

	it('returns candidates from the registered indexer', async () => {
		registerInputIndexer('index_test_mod', async () => [
			{ module: 'index_test_mod', table: 't', id: 'a', label: 'A' },
			{ module: 'index_test_mod', table: 't', id: 'b', label: 'B', hint: 'note' },
		]);
		const list = await getInputCandidates('index_test_mod');
		expect(list).toHaveLength(2);
		expect(list[0].label).toBe('A');
		expect(list[1].hint).toBe('note');
	});

	it('returns empty array for unknown module', async () => {
		expect(await getInputCandidates('nope')).toEqual([]);
	});

	it('catches indexer errors and returns empty', async () => {
		registerInputIndexer('index_test_boom', async () => {
			throw new Error('broken');
		});
		const list = await getInputCandidates('index_test_boom');
		expect(list).toEqual([]);
	});
});
