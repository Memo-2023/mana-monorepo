import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DeductCreditsOptions {
	appId: string;
	description: string;
	apiKeyId?: string;
	metadata?: Record<string, any>;
}

export interface CreditBalance {
	balance: number;
	freeCreditsRemaining: number;
	dailyFreeCredits: number;
}

@Injectable()
export class CreditsService {
	private readonly authUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.authUrl = this.configService.get('auth.url') || 'http://localhost:3001';
	}

	/**
	 * Deduct credits from a user's account
	 */
	async deduct(userId: string, amount: number, options: DeductCreditsOptions): Promise<void> {
		const response = await fetch(`${this.authUrl}/api/v1/credits/consume`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				amount,
				appId: options.appId,
				description: options.description,
				metadata: {
					...options.metadata,
					apiKeyId: options.apiKeyId,
					source: 'api-gateway',
				},
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error(`Failed to deduct credits for user ${userId}:`, error);
			// Don't throw - credit deduction failure shouldn't fail the request
			// The API key credits are already tracked
		}
	}

	/**
	 * Get a user's credit balance
	 */
	async getBalance(userId: string): Promise<CreditBalance | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/credits/balance/${userId}`);

			if (!response.ok) {
				return null;
			}

			return response.json();
		} catch (error) {
			console.error(`Failed to get credit balance for user ${userId}:`, error);
			return null;
		}
	}

	/**
	 * Add credits to a user's account (for testing/admin)
	 */
	async addCredits(userId: string, amount: number, reason: string): Promise<void> {
		const response = await fetch(`${this.authUrl}/api/v1/credits/add`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				amount,
				appId: 'api-gateway',
				description: reason,
				type: 'bonus',
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new HttpException(`Failed to add credits: ${error}`, HttpStatus.BAD_GATEWAY);
		}
	}
}
