/**
 * Thin HTTP client for mana-llm (OpenAI-compatible surface on /v1/chat/completions).
 *
 * The prompt/parser logic lives in the webapp's
 * `apps/mana/apps/web/src/lib/data/ai/missions/planner/` directory and is
 * duplicated here as server-side copies in follow-up work — keeping the
 * webapp as source of truth for now while the service matures.
 */

import { plannerLatency } from '../metrics';

export interface PlannerMessages {
	system: string;
	user: string;
}

export interface PlannerResult {
	/** Raw text the LLM returned. Parser lives alongside the caller. */
	content: string;
}

export class PlannerClient {
	constructor(
		private readonly baseUrl: string,
		private readonly serviceKey: string
	) {}

	async complete(
		messages: PlannerMessages,
		opts: { model?: string; temperature?: number } = {}
	): Promise<PlannerResult> {
		const endTimer = plannerLatency.startTimer();
		try {
			return await this.doComplete(messages, opts);
		} finally {
			endTimer();
		}
	}

	private async doComplete(
		messages: PlannerMessages,
		opts: { model?: string; temperature?: number }
	): Promise<PlannerResult> {
		const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${this.serviceKey}`,
			},
			body: JSON.stringify({
				model: opts.model ?? 'gpt-4o-mini',
				temperature: opts.temperature ?? 0.3,
				messages: [
					{ role: 'system', content: messages.system },
					{ role: 'user', content: messages.user },
				],
			}),
		});

		if (!res.ok) {
			throw new Error(`mana-llm ${res.status}: ${await res.text().catch(() => '')}`);
		}

		const body = (await res.json()) as {
			choices?: { message?: { content?: string } }[];
		};
		const content = body.choices?.[0]?.message?.content ?? '';
		return { content };
	}
}
