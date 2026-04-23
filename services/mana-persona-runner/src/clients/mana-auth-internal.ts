/**
 * Service-to-service client for mana-auth's internal persona endpoints.
 *
 * Three calls: list due personas, post actions batch, post feedback
 * batch. All gated by `X-Service-Key` (not a user JWT).
 */

import type { ActionRow, FeedbackRow } from '../runner/types.ts';

export interface DuePersona {
	userId: string;
	email: string;
	archetype: string;
	systemPrompt: string;
	moduleMix: Record<string, number>;
	tickCadence: 'daily' | 'weekdays' | 'hourly';
	lastActiveAt: string | null;
}

export class ManaAuthInternalClient {
	constructor(
		private readonly authUrl: string,
		private readonly serviceKey: string
	) {
		if (!serviceKey) {
			throw new Error('ManaAuthInternalClient: serviceKey is required (MANA_SERVICE_KEY)');
		}
	}

	private headers(): Record<string, string> {
		return {
			'content-type': 'application/json',
			'x-service-key': this.serviceKey,
		};
	}

	async listDuePersonas(): Promise<DuePersona[]> {
		const res = await fetch(`${this.authUrl}/api/v1/internal/personas/due`, {
			headers: this.headers(),
		});
		if (!res.ok) {
			throw new Error(`listDuePersonas failed: HTTP ${res.status} — ${await res.text()}`);
		}
		const body = (await res.json()) as { personas: DuePersona[] };
		return body.personas;
	}

	async postActions(personaId: string, actions: ActionRow[]): Promise<void> {
		if (actions.length === 0) return;
		const res = await fetch(`${this.authUrl}/api/v1/internal/personas/${personaId}/actions`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify({ actions }),
		});
		if (!res.ok) {
			throw new Error(`postActions failed: HTTP ${res.status} — ${await res.text()}`);
		}
	}

	async postFeedback(personaId: string, feedback: FeedbackRow[]): Promise<void> {
		if (feedback.length === 0) return;
		const res = await fetch(`${this.authUrl}/api/v1/internal/personas/${personaId}/feedback`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify({ feedback }),
		});
		if (!res.ok) {
			throw new Error(`postFeedback failed: HTTP ${res.status} — ${await res.text()}`);
		}
	}
}
