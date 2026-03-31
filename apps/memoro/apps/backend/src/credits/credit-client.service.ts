import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InsufficientCreditsException } from '../errors/insufficient-credits.error';

export interface CreditCheckResponse {
	hasEnoughCredits: boolean;
	currentCredits: number;
	requiredCredits: number;
	creditType: 'user' | 'space';
}

export interface CreditConsumptionResponse {
	success: boolean;
	message: string;
	remainingCredits?: number;
}

@Injectable()
export class CreditClientService {
	private readonly manaServiceUrl: string;

	constructor(private configService: ConfigService) {
		this.manaServiceUrl = this.configService.get<string>(
			'MANA_SERVICE_URL',
			'http://localhost:3000'
		);
	}

	/**
	 * Check if user has enough personal credits
	 */
	async checkUserCredits(
		userId: string,
		requiredCredits: number,
		token: string
	): Promise<CreditCheckResponse> {
		try {
			const response = await fetch(`${this.manaServiceUrl}/users/credits`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new BadRequestException(
					`Failed to check user credits: ${errorData.message || response.statusText}`
				);
			}

			const data = await response.json();
			const currentCredits = data.credits || 0;

			return {
				hasEnoughCredits: currentCredits >= requiredCredits,
				currentCredits,
				requiredCredits,
				creditType: 'user',
			};
		} catch (error) {
			console.error('Error checking user credits:', error);
			throw error;
		}
	}

	/**
	 * Check if space has enough credits
	 */
	async checkSpaceCredits(
		spaceId: string,
		requiredCredits: number,
		token: string
	): Promise<CreditCheckResponse> {
		try {
			const response = await fetch(`${this.manaServiceUrl}/spaces/${spaceId}/credits`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new BadRequestException(
					`Failed to check space credits: ${errorData.message || response.statusText}`
				);
			}

			const data = await response.json();
			const currentCredits = data.space?.credits || data.creditSummary?.current_balance || 0;

			return {
				hasEnoughCredits: currentCredits >= requiredCredits,
				currentCredits,
				requiredCredits,
				creditType: 'space',
			};
		} catch (error) {
			console.error('Error checking space credits:', error);
			throw error;
		}
	}

	/**
	 * Consume credits from user's personal balance
	 */
	async consumeUserCredits(
		userId: string,
		amount: number,
		token: string,
		description?: string
	): Promise<CreditConsumptionResponse> {
		try {
			const response = await fetch(`${this.manaServiceUrl}/users/credits/consume`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					amount,
					description: description || `Credit consumption for operation`,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 400 && errorData.message?.includes('insufficient')) {
					throw new InsufficientCreditsException({
						requiredCredits: amount,
						availableCredits: 0, // We don't know the exact amount from this error
						creditType: 'user',
						operation: 'credit_consumption',
					});
				}

				throw new BadRequestException(
					`Failed to consume user credits: ${errorData.message || response.statusText}`
				);
			}

			const data = await response.json();
			return {
				success: true,
				message: data.message || 'Credits consumed successfully',
			};
		} catch (error) {
			console.error('Error consuming user credits:', error);
			throw error;
		}
	}

	/**
	 * Consume credits from space balance
	 */
	async consumeSpaceCredits(
		spaceId: string,
		amount: number,
		token: string,
		description?: string
	): Promise<CreditConsumptionResponse> {
		try {
			const response = await fetch(`${this.manaServiceUrl}/spaces/${spaceId}/credits/consume`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					amount,
					description: description || `Credit consumption for operation`,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 400 && errorData.message?.includes('insufficient')) {
					throw new InsufficientCreditsException({
						requiredCredits: amount,
						availableCredits: 0, // We don't know the exact amount from this error
						creditType: 'space',
						operation: 'credit_consumption',
					});
				}

				throw new BadRequestException(
					`Failed to consume space credits: ${errorData.message || response.statusText}`
				);
			}

			const data = await response.json();
			return {
				success: true,
				message: data.message || 'Credits consumed successfully',
			};
		} catch (error) {
			console.error('Error consuming space credits:', error);
			throw error;
		}
	}

	/**
	 * Check and consume credits based on operation context
	 * If spaceId is provided, check space credits first, fall back to user credits
	 * If no spaceId, use user credits only
	 */
	async checkAndConsumeCredits(
		userId: string,
		requiredCredits: number,
		token: string,
		options: {
			spaceId?: string;
			description?: string;
			operation: string;
		}
	): Promise<{ consumed: boolean; creditType: 'user' | 'space'; message: string }> {
		const { spaceId, description, operation } = options;

		try {
			// If spaceId provided, try space credits first
			if (spaceId) {
				try {
					const spaceCheck = await this.checkSpaceCredits(spaceId, requiredCredits, token);

					if (spaceCheck.hasEnoughCredits) {
						await this.consumeSpaceCredits(
							spaceId,
							requiredCredits,
							token,
							description || `${operation} operation`
						);
						return {
							consumed: true,
							creditType: 'space',
							message: `Consumed ${requiredCredits} credits from space balance`,
						};
					}
				} catch (spaceError) {
					console.warn(
						`Space credit check failed, falling back to user credits: ${spaceError.message}`
					);
				}
			}

			// Use user credits (either as fallback or primary)
			const userCheck = await this.checkUserCredits(userId, requiredCredits, token);

			if (!userCheck.hasEnoughCredits) {
				throw new InsufficientCreditsException({
					requiredCredits,
					availableCredits: userCheck.currentCredits,
					creditType: userCheck.creditType,
					operation: options.operation,
					spaceId: options.spaceId,
				});
			}

			await this.consumeUserCredits(
				userId,
				requiredCredits,
				token,
				description || `${operation} operation`
			);
			return {
				consumed: true,
				creditType: 'user',
				message: `Consumed ${requiredCredits} credits from user balance`,
			};
		} catch (error) {
			console.error(`Credit check and consumption failed for ${operation}:`, error);
			throw error;
		}
	}
}
