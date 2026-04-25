/**
 * Unit tests for the per-space-seeds registry. Pure module — no Dexie,
 * no fake-indexeddb needed. Covers the contract:
 *   - register + run drives every registered seeder with the spaceId
 *   - duplicate-name registration overwrites (HMR friendliness)
 *   - one seeder throwing doesn't stop the others
 *   - empty registry is a benign no-op
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerSpaceSeed, runSpaceSeeds, __resetSpaceSeedsForTests } from './per-space-seeds';

afterEach(() => {
	__resetSpaceSeedsForTests();
	vi.restoreAllMocks();
});

describe('runSpaceSeeds', () => {
	it('runs every registered seeder with the supplied spaceId', async () => {
		const a = vi.fn().mockResolvedValue(undefined);
		const b = vi.fn().mockResolvedValue(undefined);
		registerSpaceSeed('a', a);
		registerSpaceSeed('b', b);

		await runSpaceSeeds('space-xyz');

		expect(a).toHaveBeenCalledWith('space-xyz');
		expect(b).toHaveBeenCalledWith('space-xyz');
	});

	it('is a no-op with no seeders registered', async () => {
		await expect(runSpaceSeeds('space-xyz')).resolves.toBeUndefined();
	});

	it('overwrites a seeder when registered under the same name (HMR friendliness)', async () => {
		const first = vi.fn().mockResolvedValue(undefined);
		const second = vi.fn().mockResolvedValue(undefined);
		registerSpaceSeed('module-x', first);
		registerSpaceSeed('module-x', second);

		await runSpaceSeeds('space-xyz');

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledWith('space-xyz');
	});

	it('isolates errors so one bad seeder does not stop the others', async () => {
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const broken = vi.fn().mockRejectedValue(new Error('boom'));
		const ok = vi.fn().mockResolvedValue(undefined);
		registerSpaceSeed('broken', broken);
		registerSpaceSeed('ok', ok);

		await runSpaceSeeds('space-xyz');

		expect(broken).toHaveBeenCalled();
		expect(ok).toHaveBeenCalled();
		expect(errSpy).toHaveBeenCalledWith(
			expect.stringContaining("'broken' failed"),
			expect.any(Error)
		);
	});

	it('awaits each seeder sequentially in registration order', async () => {
		const order: string[] = [];
		registerSpaceSeed('first', async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			order.push('first');
		});
		registerSpaceSeed('second', async () => {
			order.push('second');
		});

		await runSpaceSeeds('space-xyz');

		expect(order).toEqual(['first', 'second']);
	});
});
