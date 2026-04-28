/**
 * Single-token rate limiter. Used for Nominatim's strict 1-req/sec policy.
 *
 * Why not p-queue / bottleneck: those are great packages but the surface
 * we need is tiny (one slot, fixed interval, FIFO) and we want to keep
 * the wrapper dependency-light. This is ~30 lines of code with a tight
 * test surface.
 *
 * Behavior:
 *   - At most 1 task running at a time.
 *   - Between successive task starts: at least `intervalMs` elapses.
 *   - Tasks queue in FIFO order. No prioritization, no skipping.
 *   - Caller can pass an `AbortSignal` to drop their slot if they no
 *     longer want the answer (e.g. the wrapper's overall timeout fired).
 */

export class RateLimiter {
	private queue: Array<() => void> = [];
	private nextSlotAt = 0;
	private busy = false;

	constructor(private readonly intervalMs: number) {}

	async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
		await this.acquire(signal);
		try {
			return await task();
		} finally {
			this.release();
		}
	}

	private async acquire(signal?: AbortSignal): Promise<void> {
		// Wait for the previous task to release the slot. The lock is
		// implemented as a queue of resume-functions; release() pops one.
		// We need a stable reference to remove from the queue on abort —
		// a named closure works because we push and splice the same one.
		if (this.busy) {
			await new Promise<void>((resolve, reject) => {
				const entry = () => {
					signal?.removeEventListener('abort', onAbort);
					resolve();
				};
				const onAbort = () => {
					const idx = this.queue.indexOf(entry);
					if (idx >= 0) this.queue.splice(idx, 1);
					reject(new Error('aborted'));
				};
				signal?.addEventListener('abort', onAbort, { once: true });
				this.queue.push(entry);
			});
		}
		this.busy = true;

		// Honor the inter-task gap. Even if the previous task ran fast,
		// we space starts at least `intervalMs` apart.
		const wait = this.nextSlotAt - Date.now();
		if (wait > 0) {
			try {
				await sleep(wait, signal);
			} catch (e) {
				// Aborted during the inter-task wait. We've already claimed
				// the busy flag — release it so the next queued task can
				// proceed instead of deadlocking.
				this.release();
				throw e;
			}
		}

		this.nextSlotAt = Date.now() + this.intervalMs;
	}

	private release(): void {
		const next = this.queue.shift();
		this.busy = !!next;
		if (next) next();
	}

	get pending(): number {
		return this.queue.length;
	}
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const t = setTimeout(resolve, ms);
		signal?.addEventListener(
			'abort',
			() => {
				clearTimeout(t);
				reject(new Error('aborted'));
			},
			{ once: true }
		);
	});
}
