import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InsufficientCreditsException } from '../errors/insufficient-credits.error';

export interface CreditConsumptionResult {
	success: boolean;
	creditsConsumed: number;
	creditType: 'user' | 'space';
	remainingCredits?: number;
	message: string;
	error?: string;
}

export interface CreditOperationMetadata {
	memoId?: string;
	route?: string;
	durationMinutes?: number;
	actualCost?: number;
	operationId?: string;
	[key: string]: any;
}

export type CreditOperation =
	| 'transcription'
	| 'question'
	| 'combination'
	| 'blueprint'
	| 'headline'
	| 'memory_creation'
	| 'memo_sharing'
	| 'space_operation'
	| 'meeting_recording';

@Injectable()
export class CreditConsumptionService {
	private readonly logger = new Logger(CreditConsumptionService.name);
	private readonly manaServiceUrl: string;
	private readonly manaServiceKey: string;
	private readonly appId: string;

	constructor(private configService: ConfigService) {
		this.manaServiceUrl =
			this.configService.get<string>('MANA_SERVICE_URL') ||
			'https://mana-core-middleware-111768794939.europe-west3.run.app';
		this.manaServiceUrl = this.manaServiceUrl.replace(/\/$/, '');
		this.manaServiceKey = this.configService.get<string>('MANA_SUPABASE_SECRET_KEY');
		this.appId = this.configService.get<string>('MEMORO_APP_ID');

		if (!this.appId) {
			throw new Error('MEMORO_APP_ID environment variable is required');
		}
	}

	/**
	 * Centralized credit consumption for all operations
	 * Uses the existing user JWT token to work with RLS
	 */
	async consumeCreditsForOperation(
		userId: string,
		operation: CreditOperation,
		amount: number,
		description: string,
		metadata: CreditOperationMetadata = {},
		spaceId?: string,
		userToken?: string
	): Promise<CreditConsumptionResult> {
		try {
			this.logger.log(
				`[consumeCreditsForOperation] ${operation}: ${amount} credits for user ${userId}${spaceId ? ` in space ${spaceId}` : ''}`
			);

			// Input validation
			if (!userId) {
				throw new BadRequestException('User ID is required');
			}
			if (amount <= 0) {
				throw new BadRequestException('Credit amount must be positive');
			}
			// Determine if we're using service auth or user auth
			const isServiceAuth = !userToken;

			// Prepare request body for mana-core-middleware
			const consumeBody = {
				userId,
				appId: this.appId,
				amount,
				operation,
				description,
				metadata: {
					...metadata,
					service: 'memoro-service',
					timestamp: new Date().toISOString(),
				},
				spaceId,
			};

			let response;

			if (isServiceAuth) {
				// Use service authentication endpoint
				this.logger.log(`[consumeCreditsForOperation] Using service auth for user ${userId}`);

				if (!this.manaServiceKey) {
					throw new Error('MANA_SUPABASE_SECRET_KEY not configured');
				}

				// Use service endpoint with different body structure
				const serviceBody = {
					userId,
					appId: this.appId,
					amount,
					operationType: operation,
					description,
					operationDetails: metadata,
					spaceId,
				};

				response = await fetch(`${this.manaServiceUrl}/credits/service/consume`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.manaServiceKey}`,
						'X-Service-Auth': 'memoro-service',
					},
					body: JSON.stringify(serviceBody),
				});
			} else {
				// Use regular user token auth
				this.logger.log(
					`[consumeCreditsForOperation] Using user token: ${userToken.substring(0, 50)}...`
				);

				// Try to decode token payload for debugging (without verification)
				try {
					const parts = userToken.split('.');
					if (parts.length === 3) {
						const payload = parts[1];
						const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
						const decodedPayload = Buffer.from(paddedPayload, 'base64').toString();
						const tokenData = JSON.parse(decodedPayload);
						this.logger.log(
							`[consumeCreditsForOperation] Token payload:`,
							JSON.stringify(tokenData, null, 2)
						);
						this.logger.log(
							`[consumeCreditsForOperation] Token has app_id: ${tokenData.app_id}, sub: ${tokenData.sub}, aud: ${tokenData.aud}`
						);
					}
				} catch (decodeError) {
					this.logger.warn(
						`[consumeCreditsForOperation] Could not decode token for debugging:`,
						decodeError.message
					);
				}

				response = await fetch(`${this.manaServiceUrl}/credits/consume`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${userToken}`,
						'X-Service-Auth': 'memoro-service',
					},
					body: JSON.stringify(consumeBody),
				});
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;

				this.logger.error(
					`[consumeCreditsForOperation] Credit consumption failed: ${response.status} - ${errorMessage}`
				);

				if (response.status === 400 && errorMessage.toLowerCase().includes('insufficient')) {
					// Try to extract available credits from error message if possible
					const availableMatch = errorMessage.match(/Available:\s*(\d+)/);
					const availableCredits = availableMatch ? parseInt(availableMatch[1]) : 0;

					throw new InsufficientCreditsException({
						requiredCredits: amount,
						availableCredits,
						creditType: spaceId ? 'space' : 'user',
						operation,
						spaceId,
					});
				}

				throw new Error(`Credit consumption failed: ${errorMessage}`);
			}

			const result = await response.json();

			this.logger.log(
				`[consumeCreditsForOperation] Successfully consumed ${amount} credits for ${operation}`
			);

			// Note: Frontend will refresh credits periodically or after operations

			return {
				success: true,
				creditsConsumed: amount,
				creditType: result.creditType || (spaceId ? 'space' : 'user'),
				remainingCredits: result.remainingCredits,
				message: result.message || 'Credits consumed successfully',
			};
		} catch (error) {
			this.logger.error(
				`[consumeCreditsForOperation] Error consuming credits for ${operation}:`,
				error
			);

			if (
				error instanceof BadRequestException ||
				error instanceof ForbiddenException ||
				error instanceof InsufficientCreditsException
			) {
				throw error;
			}

			return {
				success: false,
				creditsConsumed: 0,
				creditType: spaceId ? 'space' : 'user',
				message: 'Credit consumption failed',
				error: error.message,
			};
		}
	}

	/**
	 * Convenience methods for specific operations
	 */
	async consumeTranscriptionCredits(
		userId: string,
		durationMinutes: number,
		actualCost: number,
		memoId: string,
		route: 'fast' | 'batch',
		spaceId?: string,
		userToken?: string
	): Promise<CreditConsumptionResult> {
		return this.consumeCreditsForOperation(
			userId,
			'transcription',
			actualCost,
			`Transcription completed via ${route} route for memo ${memoId}`,
			{
				memoId,
				route,
				durationMinutes,
				actualCost,
			},
			spaceId,
			userToken
		);
	}

	async consumeQuestionCredits(
		userId: string,
		memoId: string,
		questionText: string,
		spaceId?: string,
		userToken?: string
	): Promise<CreditConsumptionResult> {
		const questionCost = 5; // Standard question cost
		return this.consumeCreditsForOperation(
			userId,
			'question',
			questionCost,
			`Question asked on memo ${memoId}`,
			{
				memoId,
				questionLength: questionText.length,
				questionPreview: questionText.substring(0, 100),
			},
			spaceId,
			userToken
		);
	}

	async consumeCombinationCredits(
		userId: string,
		memoIds: string[],
		spaceId?: string,
		userToken?: string
	): Promise<CreditConsumptionResult> {
		const combinationCost = memoIds.length * 5; // 5 credits per memo
		return this.consumeCreditsForOperation(
			userId,
			'combination',
			combinationCost,
			`Combined ${memoIds.length} memos`,
			{
				memoCount: memoIds.length,
				memoIds,
			},
			spaceId,
			userToken
		);
	}

	async consumeBlueprintCredits(
		userId: string,
		blueprintId: string,
		memoId: string,
		spaceId?: string,
		userToken?: string
	): Promise<CreditConsumptionResult> {
		const blueprintCost = 5; // Standard blueprint cost
		return this.consumeCreditsForOperation(
			userId,
			'blueprint',
			blueprintCost,
			`Blueprint ${blueprintId} applied to memo ${memoId}`,
			{
				blueprintId,
				memoId,
			},
			spaceId,
			userToken
		);
	}

	async consumeHeadlineCredits(
		userId: string,
		memoId: string,
		spaceId?: string,
		userToken?: string
	): Promise<CreditConsumptionResult> {
		const headlineCost = 10; // Standard headline cost
		return this.consumeCreditsForOperation(
			userId,
			'headline',
			headlineCost,
			`Headline generation for memo ${memoId}`,
			{
				memoId,
			},
			spaceId,
			userToken
		);
	}

	/**
	 * Validate credits before operation (pre-flight check)
	 */
	async validateCreditsForOperation(
		userId: string,
		operation: CreditOperation,
		amount: number,
		spaceId?: string
	): Promise<{ hasEnoughCredits: boolean; availableCredits: number; requiredCredits: number }> {
		try {
			if (!this.manaServiceKey) {
				throw new Error('MANA_SUPABASE_SECRET_KEY not configured');
			}

			const response = await fetch(`${this.manaServiceUrl}/credits/service/validate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.manaServiceKey}`,
					'X-Service-Auth': 'memoro-service',
				},
				body: JSON.stringify({
					userId,
					amount,
					spaceId,
					operation,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				this.logger.warn(`Credit validation failed: ${errorData.message}`);
				return {
					hasEnoughCredits: false,
					availableCredits: 0,
					requiredCredits: amount,
				};
			}

			const result = await response.json();
			return {
				// mana-core returns { hasCredits, balance }
				hasEnoughCredits: result.hasCredits || result.valid || false,
				availableCredits: result.balance || result.availableCredits || 0,
				requiredCredits: amount,
			};
		} catch (error) {
			this.logger.error('Error validating credits:', error);
			return {
				hasEnoughCredits: false,
				availableCredits: 0,
				requiredCredits: amount,
			};
		}
	}

	/**
	 * Get current credit balance for user
	 */
	async getCurrentCredits(
		userId: string,
		spaceId?: string
	): Promise<{ userCredits: number; spaceCredits?: number }> {
		try {
			if (!this.manaServiceKey) {
				throw new Error('MANA_SUPABASE_SECRET_KEY not configured');
			}

			// Get user credits
			const userResponse = await fetch(`${this.manaServiceUrl}/users/credits`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.manaServiceKey}`,
					'X-Service-Auth': 'memoro-service',
					'X-User-ID': userId, // Pass user ID in header for service role requests
				},
			});

			let userCredits = 0;
			if (userResponse.ok) {
				const userData = await userResponse.json();
				userCredits = userData.credits || 0;
			}

			let spaceCredits = undefined;
			if (spaceId) {
				const spaceResponse = await fetch(`${this.manaServiceUrl}/spaces/${spaceId}/credits`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${this.manaServiceKey}`,
						'X-Service-Auth': 'memoro-service',
						'X-User-ID': userId,
					},
				});

				if (spaceResponse.ok) {
					const spaceData = await spaceResponse.json();
					spaceCredits = spaceData.creditSummary?.current_balance || 0;
				}
			}

			return { userCredits, spaceCredits };
		} catch (error) {
			this.logger.error('Error getting current credits:', error);
			return { userCredits: 0, spaceCredits: undefined };
		}
	}
}
