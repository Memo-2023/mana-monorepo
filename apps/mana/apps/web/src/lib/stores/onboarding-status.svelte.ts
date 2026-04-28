/**
 * Onboarding status store — mirrors the `onboardingCompletedAt` column
 * from `mana-auth.auth.users`.
 *
 * Kept separate from `authStore`/`userSettings` because:
 *   1. It changes at most twice in a user's lifetime (complete, reset),
 *      so folding it into the hot-path auth state is noise.
 *   2. We want a dedicated endpoint so finishing the flow takes effect
 *      without re-minting the JWT (see docs/plans/onboarding-flow.md).
 *
 * Used by the `(app)` layout guard (M2+) to redirect new users into
 * `/onboarding/name`, and by the `templates/+page.svelte` finish handler
 * to mark the flow done.
 */

import { browser } from '$app/environment';
import { authStore } from './auth.svelte';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
			.__PUBLIC_MANA_AUTH_URL__;
		if (injected) return injected;
	}
	return import.meta.env.DEV ? 'http://localhost:3001' : '';
}

type Status = { completedAt: Date | null };

function parseStatus(raw: { completedAt: string | null }): Status {
	return { completedAt: raw.completedAt ? new Date(raw.completedAt) : null };
}

function createOnboardingStatusStore() {
	let completedAt = $state<Date | null>(null);
	let loaded = $state(false);
	let loading = $state(false);

	async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
		const token = await authStore.getValidToken();
		if (!token) throw new Error('Not authenticated');
		return fetch(`${getAuthUrl()}/api/v1/me/onboarding${path}`, {
			...init,
			headers: {
				...(init?.headers ?? {}),
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});
	}

	return {
		get completedAt() {
			return completedAt;
		},
		get loaded() {
			return loaded;
		},
		get loading() {
			return loading;
		},
		/** True when the user still needs to go through the flow. */
		get needsOnboarding() {
			return loaded && completedAt === null;
		},

		async load(): Promise<void> {
			if (!browser || loading) return;
			loading = true;
			try {
				// Empty path — `${baseUrl}/api/v1/me/onboarding` without a
				// trailing slash. Hono's nested router (`app.route(prefix,
				// sub)` + inner `app.get('/')`) matches the prefix exactly,
				// not the prefix-with-slash form, so a `/` here would 404.
				const res = await authedFetch('');
				if (!res.ok) throw new Error(`GET /onboarding → ${res.status}`);
				const data = (await res.json()) as { completedAt: string | null };
				({ completedAt } = parseStatus(data));
				loaded = true;
			} catch (err) {
				// A failed load must not hard-block rendering — the guard
				// treats `loaded === false` as "not sure yet, don't
				// redirect". Logged so a live issue is visible in telemetry.
				console.warn('[onboarding-status] load failed:', err);
			} finally {
				loading = false;
			}
		},

		async markComplete(): Promise<void> {
			if (!browser) return;
			const res = await authedFetch('/complete', { method: 'POST' });
			if (!res.ok) throw new Error(`POST /onboarding/complete → ${res.status}`);
			const data = (await res.json()) as { completedAt: string | null };
			({ completedAt } = parseStatus(data));
			loaded = true;
		},

		async reset(): Promise<void> {
			if (!browser) return;
			const res = await authedFetch('/reset', { method: 'PATCH' });
			if (!res.ok) throw new Error(`PATCH /onboarding/reset → ${res.status}`);
			completedAt = null;
			loaded = true;
		},
	};
}

export const onboardingStatus = createOnboardingStatusStore();
