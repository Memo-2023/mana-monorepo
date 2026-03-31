import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../decorators/user.decorator';
import { CreditConsumptionService } from '../credits/credit-consumption.service';
import { OPERATION_COSTS } from '../credits/pricing.constants';
import { InsufficientCreditsException } from '../errors/insufficient-credits.error';
import { QuestionService } from '../ai/memory/question.service';

class QuestionMemoDto {
	memo_id: string;
	question: string;
	spaceId?: string;
}

@Controller('memoro/question-memo')
@UseGuards(AuthGuard)
export class QuestionMemoController {
	constructor(
		private readonly creditConsumptionService: CreditConsumptionService,
		private readonly questionService: QuestionService
	) {}

	@Post()
	async processQuestionMemo(@User() user: any, @Body() dto: QuestionMemoDto) {
		console.log('QuestionMemoController - Request received:', {
			memo_id: dto.memo_id,
			question: dto.question?.substring(0, 50) + '...',
			user_id: user.sub,
			has_token: !!user.token,
		});

		if (!dto.memo_id || !dto.question?.trim()) {
			throw new BadRequestException('memo_id and question are required');
		}

		// Extract token from request
		const token = user.token;
		const requiredCredits = OPERATION_COSTS.QUESTION_MEMO;

		console.log('QuestionMemoController - Starting credit check, required:', requiredCredits);

		try {
			// Check and consume credits first using centralized service
			console.log('QuestionMemoController - Calling creditConsumptionService...');
			const creditResult = await this.creditConsumptionService.consumeQuestionCredits(
				user.sub,
				dto.memo_id,
				dto.question,
				dto.spaceId,
				token
			);

			if (!creditResult.success) {
				throw new BadRequestException(creditResult.message || creditResult.error);
			}

			console.log('QuestionMemoController - Credits consumed successfully:', creditResult);

			// Process question locally via QuestionService (replaces Supabase Edge Function)
			console.log('QuestionMemoController - Processing question via QuestionService');

			const result = await this.questionService.askQuestion(dto.memo_id, dto.question.trim());

			console.log('QuestionMemoController - QuestionService result:', {
				memoryId: result.memoryId,
			});

			return {
				success: true,
				memory_id: result.memoryId,
				answer: result.answer,
				question: result.question,
				creditsConsumed: requiredCredits,
				creditType: creditResult.creditType,
			};
		} catch (error) {
			console.error('QuestionMemoController - Error occurred:', error);

			if (error instanceof InsufficientCreditsException) {
				throw error; // Let the exception propagate with 402 status
			}

			if (error.message?.includes('insufficient credits')) {
				// Fallback for any legacy insufficient credit errors
				throw new InsufficientCreditsException({
					requiredCredits,
					availableCredits: 0,
					creditType: dto.spaceId ? 'space' : 'user',
					operation: 'question',
					spaceId: dto.spaceId,
				});
			}
			throw new BadRequestException(error.message);
		}
	}
}
