import { Controller, Post, Body, UseGuards, BadRequestException, Get } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../decorators/user.decorator';
import { CreditClientService } from './credit-client.service';
import {
	calculateTranscriptionCost,
	calculateTranscriptionCostByLength,
	OPERATION_COSTS,
} from './pricing.constants';
import { InsufficientCreditsException } from '../errors/insufficient-credits.error';

// DTOs for credit operations
class CheckTranscriptionCreditsDto {
	durationSeconds?: number;
	transcriptLength?: number;
	spaceId?: string;
}

class ConsumeTranscriptionCreditsDto {
	durationSeconds?: number;
	transcriptLength?: number;
	spaceId?: string;
	description?: string;
}

class ConsumeOperationCreditsDto {
	operation:
		| 'HEADLINE_GENERATION'
		| 'MEMORY_CREATION'
		| 'BLUEPRINT_PROCESSING'
		| 'QUESTION_MEMO'
		| 'NEW_MEMORY'
		| 'MEMO_COMBINE';
	spaceId?: string;
	description?: string;
	memoId?: string;
	memoCount?: number; // For MEMO_COMBINE operation
}

@Controller('memoro/credits')
export class CreditController {
	constructor(private readonly creditClientService: CreditClientService) {}

	@Get('pricing')
	async getPricing() {
		return {
			operationCosts: OPERATION_COSTS,
			transcriptionPerHour: OPERATION_COSTS.TRANSCRIPTION_PER_MINUTE * 60,
			lastUpdated: new Date().toISOString(),
		};
	}

	@Post('check-transcription')
	@UseGuards(AuthGuard)
	async checkTranscriptionCredits(@User() user: any, @Body() dto: CheckTranscriptionCreditsDto) {
		if (!dto.durationSeconds && !dto.transcriptLength) {
			throw new BadRequestException('Either durationSeconds or transcriptLength must be provided');
		}

		// Extract token from request
		const token = user.token;

		// Calculate required credits using new length-based or duration-based pricing
		const requiredCredits = calculateTranscriptionCostByLength(
			dto.transcriptLength,
			dto.durationSeconds
		);

		try {
			// If spaceId is provided, check space credits first
			if (dto.spaceId) {
				try {
					const spaceCheck = await this.creditClientService.checkSpaceCredits(
						dto.spaceId,
						requiredCredits,
						token
					);

					return {
						hasEnoughCredits: spaceCheck.hasEnoughCredits,
						requiredCredits,
						currentCredits: spaceCheck.currentCredits,
						creditType: 'space',
					};
				} catch (error) {
					console.warn('Space credit check failed, falling back to user credits:', error.message);
				}
			}

			// Check user credits
			const userCheck = await this.creditClientService.checkUserCredits(
				user.sub,
				requiredCredits,
				token
			);

			return {
				hasEnoughCredits: userCheck.hasEnoughCredits,
				requiredCredits,
				currentCredits: userCheck.currentCredits,
				creditType: 'user',
			};
		} catch (error) {
			if (error instanceof InsufficientCreditsException) {
				throw error; // Let the exception propagate with 402 status
			}
			throw new BadRequestException(`Failed to check credits: ${error.message}`);
		}
	}

	@Post('consume-transcription')
	@UseGuards(AuthGuard)
	async consumeTranscriptionCredits(
		@User() user: any,
		@Body() dto: ConsumeTranscriptionCreditsDto
	) {
		if (!dto.durationSeconds && !dto.transcriptLength) {
			throw new BadRequestException('Either durationSeconds or transcriptLength must be provided');
		}

		// Extract token from request
		const token = user.token;

		// Calculate required credits using new length-based or duration-based pricing
		const requiredCredits = calculateTranscriptionCostByLength(
			dto.transcriptLength,
			dto.durationSeconds
		);

		const description =
			dto.description ||
			(dto.transcriptLength
				? `Transcription (${dto.transcriptLength} chars)`
				: `Transcription (${dto.durationSeconds}s)`);

		try {
			const result = await this.creditClientService.checkAndConsumeCredits(
				user.sub,
				requiredCredits,
				token,
				{
					spaceId: dto.spaceId,
					description,
					operation: 'TRANSCRIPTION',
				}
			);

			return {
				success: true,
				creditsConsumed: requiredCredits,
				creditType: result.creditType,
				message: result.message,
			};
		} catch (error) {
			if (error instanceof InsufficientCreditsException) {
				throw error; // Let the exception propagate with 402 status
			}
			throw new BadRequestException(`Failed to consume credits: ${error.message}`);
		}
	}

	@Post('consume-operation')
	@UseGuards(AuthGuard)
	async consumeOperationCredits(@User() user: any, @Body() dto: ConsumeOperationCreditsDto) {
		// Validate operation type
		const validOperations = [
			'HEADLINE_GENERATION',
			'MEMORY_CREATION',
			'BLUEPRINT_PROCESSING',
			'QUESTION_MEMO',
			'NEW_MEMORY',
			'MEMO_COMBINE',
		];
		if (!validOperations.includes(dto.operation)) {
			throw new BadRequestException(
				`Invalid operation type. Must be one of: ${validOperations.join(', ')}`
			);
		}

		// Extract token from request
		const token = user.token;

		// Define credit costs for different operations
		const creditCosts = {
			HEADLINE_GENERATION: 10,
			MEMORY_CREATION: 10,
			BLUEPRINT_PROCESSING: 5,
			QUESTION_MEMO: 5,
			NEW_MEMORY: 5,
			MEMO_COMBINE: 5,
		};

		// Calculate required credits based on operation
		let requiredCredits = creditCosts[dto.operation];

		// For MEMO_COMBINE, multiply by the number of memos
		if (dto.operation === 'MEMO_COMBINE' && dto.memoCount) {
			requiredCredits = requiredCredits * dto.memoCount;
		}
		const description = dto.description || `${dto.operation} operation`;

		try {
			const result = await this.creditClientService.checkAndConsumeCredits(
				user.sub,
				requiredCredits,
				token,
				{
					spaceId: dto.spaceId,
					description,
					operation: dto.operation,
				}
			);

			return {
				success: true,
				creditsConsumed: requiredCredits,
				creditType: result.creditType,
				message: result.message,
			};
		} catch (error) {
			if (error instanceof InsufficientCreditsException) {
				throw error; // Let the exception propagate with 402 status
			}
			throw new BadRequestException(`Failed to consume credits: ${error.message}`);
		}
	}
}
