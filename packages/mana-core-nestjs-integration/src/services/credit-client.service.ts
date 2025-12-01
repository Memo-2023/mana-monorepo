import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MANA_CORE_OPTIONS } from '../mana-core.module';
import { ManaCoreModuleOptions } from '../interfaces/mana-core-options.interface';

export interface CreditValidationResult {
	hasCredits: boolean;
	availableCredits: number;
	requiredCredits?: number;
}

export interface CreditBalance {
	balance: number;
	freeCreditsRemaining: number;
	totalEarned: number;
	totalSpent: number;
}

@Injectable()
export class CreditClientService {
	private readonly logger = new Logger(CreditClientService.name);

	constructor(
		@Optional()
		@Inject(MANA_CORE_OPTIONS)
		private readonly options?: ManaCoreModuleOptions,
		@Optional()
		private readonly configService?: ConfigService
	) {}

	private getAuthUrl(): string {
		return (
			this.configService?.get<string>('MANA_CORE_AUTH_URL') ||
			process.env.MANA_CORE_AUTH_URL ||
			'http://localhost:3001'
		);
	}

	private getServiceKey(): string {
		return (
			this.options?.serviceKey ||
			this.configService?.get<string>('MANA_CORE_SERVICE_KEY') ||
			process.env.MANA_CORE_SERVICE_KEY ||
			''
		);
	}

	private getAppId(): string {
		return (
			this.options?.appId ||
			this.configService?.get<string>('APP_ID') ||
			process.env.APP_ID ||
			''
		);
	}

	async validateCredits(
		userId: string,
		operation: string,
		requiredAmount: number
	): Promise<CreditValidationResult> {
		try {
			const balance = await this.getBalance(userId);
			const totalAvailable = balance.balance + balance.freeCreditsRemaining;

			return {
				hasCredits: totalAvailable >= requiredAmount,
				availableCredits: totalAvailable,
				requiredCredits: requiredAmount,
			};
		} catch (error) {
			this.logger.error(`Failed to validate credits for user ${userId}:`, error);
			// In case of error, we allow the operation to proceed
			// The actual credit deduction will fail if there are no credits
			return {
				hasCredits: true,
				availableCredits: 0,
				requiredCredits: requiredAmount,
			};
		}
	}

	async getBalance(userId: string): Promise<CreditBalance> {
		const authUrl = this.getAuthUrl();
		const serviceKey = this.getServiceKey();

		if (!serviceKey) {
			this.logger.warn('Service key not configured, returning default balance');
			return {
				balance: 1000,
				freeCreditsRemaining: 100,
				totalEarned: 0,
				totalSpent: 0,
			};
		}

		try {
			const response = await fetch(`${authUrl}/api/v1/credits/balance/${userId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Service-Key': serviceKey,
					'X-App-Id': this.getAppId(),
				},
			});

			if (!response.ok) {
				this.logger.warn(`Credit balance request failed: ${response.status}`);
				return this.getDefaultBalance();
			}

			const data = (await response.json()) as CreditBalance;
			return {
				balance: data.balance || 0,
				freeCreditsRemaining: data.freeCreditsRemaining || 0,
				totalEarned: data.totalEarned || 0,
				totalSpent: data.totalSpent || 0,
			};
		} catch (error) {
			this.logger.error(`Failed to get balance for user ${userId}:`, error);
			return this.getDefaultBalance();
		}
	}

	async consumeCredits(
		userId: string,
		operation: string,
		amount: number,
		description: string,
		metadata?: Record<string, any>
	): Promise<boolean> {
		const authUrl = this.getAuthUrl();
		const serviceKey = this.getServiceKey();

		if (!serviceKey) {
			this.logger.warn('Service key not configured, skipping credit consumption');
			return true;
		}

		try {
			const response = await fetch(`${authUrl}/api/v1/credits/use`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Service-Key': serviceKey,
					'X-App-Id': this.getAppId(),
				},
				body: JSON.stringify({
					userId,
					amount,
					appId: this.getAppId(),
					description,
					metadata: {
						operation,
						...metadata,
					},
				}),
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => 'Unknown error');
				this.logger.error(`Failed to consume credits: ${response.status} ${errorText}`);
				return false;
			}

			if (this.options?.debug) {
				this.logger.log(`Consumed ${amount} credits for user ${userId}: ${description}`);
			}

			return true;
		} catch (error) {
			this.logger.error(`Failed to consume credits for user ${userId}:`, error);
			return false;
		}
	}

	async refundCredits(
		userId: string,
		amount: number,
		description: string,
		metadata?: Record<string, any>
	): Promise<boolean> {
		const authUrl = this.getAuthUrl();
		const serviceKey = this.getServiceKey();

		if (!serviceKey) {
			this.logger.warn('Service key not configured, skipping credit refund');
			return true;
		}

		try {
			const response = await fetch(`${authUrl}/api/v1/credits/refund`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Service-Key': serviceKey,
					'X-App-Id': this.getAppId(),
				},
				body: JSON.stringify({
					userId,
					amount,
					appId: this.getAppId(),
					description,
					metadata,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => 'Unknown error');
				this.logger.error(`Failed to refund credits: ${response.status} ${errorText}`);
				return false;
			}

			if (this.options?.debug) {
				this.logger.log(`Refunded ${amount} credits for user ${userId}: ${description}`);
			}

			return true;
		} catch (error) {
			this.logger.error(`Failed to refund credits for user ${userId}:`, error);
			return false;
		}
	}

	private getDefaultBalance(): CreditBalance {
		return {
			balance: 1000,
			freeCreditsRemaining: 100,
			totalEarned: 0,
			totalSpent: 0,
		};
	}
}
