/**
 * Tests for the single-token rate limiter.
 *
 * The hot properties: FIFO ordering, inter-task gap honored, abort
 * removes from queue without blocking later tasks.
 */

import { describe, expect, it } from 'bun:test';
import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
	it('runs a single task immediately', async () => {
		const lim = new RateLimiter(10);
		const start = Date.now();
		const result = await lim.run(async () => 42);
		const elapsed = Date.now() - start;
		expect(result).toBe(42);
		expect(elapsed).toBeLessThan(20); // No initial wait
	});

	it('spaces successive tasks by intervalMs', async () => {
		const lim = new RateLimiter(50);
		const start = Date.now();
		await lim.run(async () => 1);
		await lim.run(async () => 2);
		const elapsed = Date.now() - start;
		// Second task waits ~50ms before starting. Allow a little jitter.
		expect(elapsed).toBeGreaterThanOrEqual(45);
		expect(elapsed).toBeLessThan(150);
	});

	it('preserves FIFO order under concurrent calls', async () => {
		const lim = new RateLimiter(20);
		const order: number[] = [];
		const tasks = [1, 2, 3, 4].map((n) =>
			lim.run(async () => {
				order.push(n);
				return n;
			})
		);
		await Promise.all(tasks);
		expect(order).toEqual([1, 2, 3, 4]);
	});

	it('reports pending count', async () => {
		const lim = new RateLimiter(50);
		// First task takes the slot — kick it off but don't await yet
		const t1 = lim.run(async () => {
			await new Promise((r) => setTimeout(r, 30));
			return 1;
		});
		// Schedule two more — they queue
		const t2 = lim.run(async () => 2);
		const t3 = lim.run(async () => 3);
		// Tiny delay so t1 has acquired the lock
		await new Promise((r) => setTimeout(r, 5));
		expect(lim.pending).toBe(2);
		await Promise.all([t1, t2, t3]);
		expect(lim.pending).toBe(0);
	});

	it('aborts a queued task without breaking later ones', async () => {
		const lim = new RateLimiter(40);
		const t1 = lim.run(async () => 'first');

		const ctrl = new AbortController();
		const t2 = lim.run(async () => 'second', ctrl.signal);
		const t3 = lim.run(async () => 'third');

		// Tiny delay to ensure t1 is running and t2/t3 are queued
		await new Promise((r) => setTimeout(r, 5));
		ctrl.abort();

		// t2 should reject with abort
		await expect(t2).rejects.toThrow(/aborted/);
		// t1 + t3 still resolve
		expect(await t1).toBe('first');
		expect(await t3).toBe('third');
	});

	it('aborts during interval-wait without breaking later tasks', async () => {
		const lim = new RateLimiter(80);
		await lim.run(async () => 'warmup'); // sets nextSlotAt = now + 80

		const ctrl = new AbortController();
		const t1 = lim.run(async () => 'next', ctrl.signal);
		// While t1 is sleeping in the interval-wait, abort it
		setTimeout(() => ctrl.abort(), 10);
		await expect(t1).rejects.toThrow(/aborted/);

		// Verify the limiter is still functional
		const t2 = await lim.run(async () => 'after');
		expect(t2).toBe('after');
	});
});
