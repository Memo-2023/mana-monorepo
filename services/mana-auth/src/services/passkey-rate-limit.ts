/**
 * Passkey-specific rate limiter.
 *
 * Kept deliberately separate from the password lockout
 * (AccountLockoutService) because:
 *
 *   1. A compromised passkey implies physical access to the
 *      authenticator — different threat model than a guessed
 *      password. Spamming failed passkey verifies is a DoS/enum
 *      attempt, not a credential-guessing attempt.
 *   2. The lockout buckets by email, but passkey
 *      /authenticate/options runs BEFORE the user is known
 *      (conditional UI gives the browser a challenge, then the
 *      authenticator picks a credential). There's no email to
 *      bucket by at that point — only IP.
 *   3. We don't want a passkey DoS to lock a user out of password
 *      login. Separate counters = separate blast radius.
 *
 * Two distinct buckets:
 *
 *   - IP-based on `/authenticate/options` (unauthenticated
 *     endpoint, amplification target): N requests per minute.
 *   - CredentialID-based on `/authenticate/verify` failures:
 *     after M failures in a minute, reject for K minutes. Protects
 *     against counter-replay + credential-harvesting.
 *
 * In-memory per-process — sufficient for single-instance dev +
 * small-scale prod. Swap to Redis once mana-auth runs multi-
 * replica. The existing `mana-redis` container is already in the
 * compose; wiring it is a straight substitution of the `Map` with
 * a Redis-backed store.
 */

import { logger } from '@mana/shared-hono';

interface Bucket {
	count: number;
	/** Epoch ms when this bucket resets */
	resetAt: number;
	/** Epoch ms until which requests are rejected (set when count exceeded) */
	blockedUntil?: number;
}

/** Config for each limiter. */
interface LimiterOptions {
	/** How many events to allow in the window. */
	limit: number;
	/** Window size in milliseconds. */
	windowMs: number;
	/** How long to block for after the limit is hit. Defaults to windowMs. */
	blockMs?: number;
}

/**
 * Two separate limiters with their own key namespaces. Exposed as a
 * single service so the passkey routes don't reach for two distinct
 * dependencies.
 */
export class PasskeyRateLimitService {
	private ipBuckets = new Map<string, Bucket>();
	private credentialBuckets = new Map<string, Bucket>();

	// Defaults chosen to be noticeable on real attacks but invisible
	// to legitimate users. Conditional UI only fires once per login
	// page mount; 20/min per IP accommodates a busy multi-user IP
	// (corporate NAT) while stopping a script looping the endpoint.
	private readonly optionsOpts: LimiterOptions = {
		limit: 20,
		windowMs: 60 * 1000,
		blockMs: 60 * 1000,
	};

	// Verify: 10 failures / min per credential → block that credential
	// for 5 min. Successful verifies reset the bucket.
	private readonly verifyOpts: LimiterOptions = {
		limit: 10,
		windowMs: 60 * 1000,
		blockMs: 5 * 60 * 1000,
	};

	/**
	 * Check + increment the IP bucket for `/authenticate/options`.
	 * Returns `{ allowed: true }` when under limit, `{ allowed: false,
	 * retryAfterSec }` when blocked.
	 *
	 * Always counts toward the limit, even when returning allowed —
	 * that's the whole point of rate limiting.
	 */
	checkOptions(ip: string): { allowed: true } | { allowed: false; retryAfterSec: number } {
		return this.bump(this.ipBuckets, ip, this.optionsOpts);
	}

	/**
	 * Record a failed `/authenticate/verify` for a given credential
	 * ID. Call this AFTER the verification upstream returned a failure
	 * (i.e. not for every verify call — only the ones that didn't
	 * authenticate). Returns the same shape as checkOptions so the
	 * caller can decide whether to still return the real error or
	 * downgrade to a rate-limit error for subsequent attempts.
	 */
	recordVerifyFailure(
		credentialId: string
	): { allowed: true } | { allowed: false; retryAfterSec: number } {
		return this.bump(this.credentialBuckets, credentialId, this.verifyOpts);
	}

	/**
	 * Check whether a credential is currently blocked WITHOUT bumping
	 * the counter. Called at the TOP of /authenticate/verify before we
	 * hit the upstream — a blocked credential should not even get its
	 * verification attempted.
	 */
	checkVerify(credentialId: string): { allowed: true } | { allowed: false; retryAfterSec: number } {
		const bucket = this.credentialBuckets.get(credentialId);
		if (!bucket) return { allowed: true };
		const now = Date.now();
		if (bucket.blockedUntil && bucket.blockedUntil > now) {
			return { allowed: false, retryAfterSec: Math.ceil((bucket.blockedUntil - now) / 1000) };
		}
		return { allowed: true };
	}

	/**
	 * Reset a credential's failure counter on successful verify so a
	 * user who mistypes their PIN a few times doesn't stay penalised
	 * after they succeed.
	 */
	clearVerifySuccess(credentialId: string): void {
		this.credentialBuckets.delete(credentialId);
	}

	private bump(
		store: Map<string, Bucket>,
		key: string,
		opts: LimiterOptions
	): { allowed: true } | { allowed: false; retryAfterSec: number } {
		const now = Date.now();
		const existing = store.get(key);

		// Reject immediately if currently blocked.
		if (existing?.blockedUntil && existing.blockedUntil > now) {
			return {
				allowed: false,
				retryAfterSec: Math.ceil((existing.blockedUntil - now) / 1000),
			};
		}

		// Start or continue a bucket.
		const bucket: Bucket =
			existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + opts.windowMs };
		bucket.count += 1;

		if (bucket.count > opts.limit) {
			bucket.blockedUntil = now + (opts.blockMs ?? opts.windowMs);
			store.set(key, bucket);
			logger.warn('passkey rate limit exceeded', {
				key: hashForLog(key),
				count: bucket.count,
				limit: opts.limit,
				blockedForSec: Math.ceil((opts.blockMs ?? opts.windowMs) / 1000),
			});
			return {
				allowed: false,
				retryAfterSec: Math.ceil((opts.blockMs ?? opts.windowMs) / 1000),
			};
		}

		store.set(key, bucket);
		return { allowed: true };
	}

	/**
	 * Sweep expired buckets. The process is long-lived and buckets
	 * never leave unless someone calls this; a user churn rate of
	 * ~1 new IP/second implies ~86k entries/day which is noticeable.
	 * Call periodically from index.ts via setInterval.
	 */
	sweep(): void {
		const now = Date.now();
		for (const [k, v] of this.ipBuckets) {
			if (v.resetAt < now && (!v.blockedUntil || v.blockedUntil < now)) {
				this.ipBuckets.delete(k);
			}
		}
		for (const [k, v] of this.credentialBuckets) {
			if (v.resetAt < now && (!v.blockedUntil || v.blockedUntil < now)) {
				this.credentialBuckets.delete(k);
			}
		}
	}
}

/**
 * Hash bucket keys for logs so IPs + credential IDs don't land in
 * JSON logs verbatim. Non-cryptographic — just obfuscation.
 */
function hashForLog(key: string): string {
	let h = 0;
	for (let i = 0; i < key.length; i++) {
		h = ((h << 5) - h + key.charCodeAt(i)) | 0;
	}
	return Math.abs(h).toString(36).padStart(8, '0').slice(0, 8);
}
