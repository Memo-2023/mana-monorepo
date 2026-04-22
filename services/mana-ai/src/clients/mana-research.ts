/**
 * HTTP client for mana-research's internal service-to-service endpoints.
 *
 * Used by the deep-research pre-planning step in the tick loop. We
 * submit the long-running research task on behalf of the mission's
 * owner, then poll on the next tick until the job is complete. Credits
 * are reserved / committed against the user by mana-research — this
 * client is a thin HTTP wrapper.
 *
 * Endpoints:
 *   POST /api/v1/internal/research/async       — submit { query, provider }
 *   GET  /api/v1/internal/research/async/:id   — poll
 *
 * Auth: X-Service-Key on every call; X-User-Id identifies the owner of
 * the credit wallet the reservation + commit hit.
 *
 * All methods return `null` on transport/parse errors rather than
 * throwing — a broken mana-research must not crash the tick loop.
 */

import type { AgentAnswer } from '@mana/shared-research';

export type DeepResearchProvider =
	| 'openai-deep-research'
	| 'gemini-deep-research'
	| 'gemini-deep-research-max';

export interface SubmitResult {
	taskId: string;
	status: 'queued' | 'running';
	providerId: DeepResearchProvider;
	costCredits: number;
}

export type PollStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface PollResult {
	taskId: string;
	status: PollStatus;
	providerId: DeepResearchProvider;
	result?: { answer: AgentAnswer };
	error?: string;
}

export class ManaResearchClient {
	constructor(
		private baseUrl: string,
		private serviceKey: string
	) {}

	async submit(
		userId: string,
		query: string,
		provider: DeepResearchProvider
	): Promise<SubmitResult | null> {
		try {
			const res = await fetch(`${this.baseUrl}/api/v1/internal/research/async`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Service-Key': this.serviceKey,
					'X-User-Id': userId,
					'X-App-Id': 'mana-ai',
				},
				body: JSON.stringify({ query, provider }),
				signal: AbortSignal.timeout(30_000),
			});
			if (!res.ok) {
				const body = await res.text().catch(() => '');
				console.warn(`[mana-research-client] submit ${res.status}: ${body.slice(0, 200)}`);
				return null;
			}
			return (await res.json()) as SubmitResult;
		} catch (err) {
			console.warn(
				'[mana-research-client] submit error:',
				err instanceof Error ? err.message : String(err)
			);
			return null;
		}
	}

	async poll(userId: string, taskId: string): Promise<PollResult | null> {
		try {
			const res = await fetch(
				`${this.baseUrl}/api/v1/internal/research/async/${encodeURIComponent(taskId)}`,
				{
					headers: {
						'X-Service-Key': this.serviceKey,
						'X-User-Id': userId,
						'X-App-Id': 'mana-ai',
					},
					signal: AbortSignal.timeout(15_000),
				}
			);
			if (!res.ok) {
				const body = await res.text().catch(() => '');
				console.warn(`[mana-research-client] poll ${res.status}: ${body.slice(0, 200)}`);
				return null;
			}
			return (await res.json()) as PollResult;
		} catch (err) {
			console.warn(
				'[mana-research-client] poll error:',
				err instanceof Error ? err.message : String(err)
			);
			return null;
		}
	}
}
