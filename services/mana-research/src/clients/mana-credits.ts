/**
 * HTTP client for mana-credits. Uses the internal Reserve/Commit/Refund endpoints
 * (added in this phase — see services/mana-credits/src/routes/internal.ts).
 */

export interface CreditsClientConfig {
	baseUrl: string;
	serviceKey: string;
}

export interface ReservationResponse {
	reservationId: string;
	balance: number;
}

export class CreditsClient {
	constructor(private config: CreditsClientConfig) {}

	private headers() {
		return {
			'Content-Type': 'application/json',
			'X-Service-Key': this.config.serviceKey,
			'X-App-Id': 'mana-research',
		};
	}

	async getBalance(userId: string): Promise<{ balance: number }> {
		const res = await fetch(
			`${this.config.baseUrl}/api/v1/internal/credits/balance/${encodeURIComponent(userId)}`,
			{ headers: this.headers() }
		);
		if (!res.ok) throw new Error(`credits.balance failed: ${res.status}`);
		return res.json() as Promise<{ balance: number }>;
	}

	async reserve(userId: string, amount: number, reason: string): Promise<ReservationResponse> {
		const res = await fetch(`${this.config.baseUrl}/api/v1/internal/credits/reserve`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify({ userId, amount, reason }),
		});
		if (!res.ok) {
			const body = await res.text();
			throw new Error(`credits.reserve failed: ${res.status} ${body}`);
		}
		return res.json() as Promise<ReservationResponse>;
	}

	async commit(reservationId: string, description?: string): Promise<{ success: boolean }> {
		const res = await fetch(`${this.config.baseUrl}/api/v1/internal/credits/commit`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify({ reservationId, description }),
		});
		if (!res.ok) throw new Error(`credits.commit failed: ${res.status}`);
		return res.json() as Promise<{ success: boolean }>;
	}

	async refund(reservationId: string): Promise<{ success: boolean }> {
		const res = await fetch(`${this.config.baseUrl}/api/v1/internal/credits/refund-reservation`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify({ reservationId }),
		});
		if (!res.ok) throw new Error(`credits.refund failed: ${res.status}`);
		return res.json() as Promise<{ success: boolean }>;
	}
}
