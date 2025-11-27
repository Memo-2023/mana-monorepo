import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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
		private readonly httpService?: HttpService
	) {}

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
		if (!this.httpService || !this.options?.manaServiceUrl) {
			this.logger.warn(
				'HTTP service or Mana service URL not configured, returning default balance'
			);
			return {
				balance: 1000,
				freeCreditsRemaining: 100,
				totalEarned: 0,
				totalSpent: 0,
			};
		}

		try {
			const response = await firstValueFrom(
				this.httpService.get<CreditBalance>(
					`${this.options.manaServiceUrl}/credits/balance/${userId}`,
					{
						headers: {
							'X-Service-Key': this.options.serviceKey || '',
							'X-App-Id': this.options.appId || '',
						},
					}
				)
			);

			return response.data;
		} catch (error) {
			this.logger.error(`Failed to get balance for user ${userId}:`, error);
			// Return default balance on error
			return {
				balance: 1000,
				freeCreditsRemaining: 100,
				totalEarned: 0,
				totalSpent: 0,
			};
		}
	}

	async consumeCredits(
		userId: string,
		operation: string,
		amount: number,
		description: string,
		metadata?: Record<string, any>
	): Promise<boolean> {
		if (!this.httpService || !this.options?.manaServiceUrl) {
			this.logger.warn(
				'HTTP service or Mana service URL not configured, skipping credit consumption'
			);
			return true;
		}

		try {
			await firstValueFrom(
				this.httpService.post(
					`${this.options.manaServiceUrl}/credits/use`,
					{
						userId,
						amount,
						appId: this.options.appId,
						description,
						metadata: {
							operation,
							...metadata,
						},
					},
					{
						headers: {
							'X-Service-Key': this.options.serviceKey || '',
							'X-App-Id': this.options.appId || '',
						},
					}
				)
			);

			if (this.options.debug) {
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
		if (!this.httpService || !this.options?.manaServiceUrl) {
			this.logger.warn('HTTP service or Mana service URL not configured, skipping credit refund');
			return true;
		}

		try {
			await firstValueFrom(
				this.httpService.post(
					`${this.options.manaServiceUrl}/credits/refund`,
					{
						userId,
						amount,
						appId: this.options.appId,
						description,
						metadata,
					},
					{
						headers: {
							'X-Service-Key': this.options.serviceKey || '',
							'X-App-Id': this.options.appId || '',
						},
					}
				)
			);

			if (this.options.debug) {
				this.logger.log(`Refunded ${amount} credits for user ${userId}: ${description}`);
			}

			return true;
		} catch (error) {
			this.logger.error(`Failed to refund credits for user ${userId}:`, error);
			return false;
		}
	}
}
