import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../decorators/user.decorator';
import { CreditConsumptionService } from '../credits/credit-consumption.service';
import { calculateMemoCombineCost } from '../credits/pricing.constants';
import { InsufficientCreditsException } from '../errors/insufficient-credits.error';

class CombineMemosDto {
	memo_ids: string[];
	blueprint_id: string;
	custom_prompt?: string;
}

@Controller('memoro/combine-memos')
@UseGuards(AuthGuard)
export class CombineMemosController {
	constructor(private readonly creditConsumptionService: CreditConsumptionService) {}

	@Post()
	async processCombineMemos(@User() user: any, @Body() dto: CombineMemosDto) {
		if (!dto.memo_ids || !Array.isArray(dto.memo_ids) || dto.memo_ids.length === 0) {
			throw new BadRequestException('memo_ids must be a non-empty array');
		}

		if (!dto.blueprint_id) {
			throw new BadRequestException('blueprint_id is required');
		}

		// Extract token from request
		const token = user.token;
		const requiredCredits = calculateMemoCombineCost(dto.memo_ids.length);

		try {
			// Check and consume credits first using centralized service
			const creditResult = await this.creditConsumptionService.consumeCombinationCredits(
				user.sub,
				dto.memo_ids,
				undefined, // spaceId
				token
			);

			if (!creditResult.success) {
				throw new BadRequestException(creditResult.message || creditResult.error);
			}

			// Now call the Supabase Edge Function to do the AI processing
			// Create an authenticated Supabase client with the user's JWT token
			const { createClient } = require('@supabase/supabase-js');
			const supabaseUrl =
				process.env.MEMORO_SUPABASE_URL || 'https://npgifbrwhftlbrbaglmi.supabase.co';
			const anonKey = process.env.MEMORO_SUPABASE_ANON_KEY;

			// Create a Supabase client with user's JWT token
			const supabase = createClient(supabaseUrl, anonKey, {
				global: {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			});

			console.log('CombineMemosController - Calling Supabase function with authenticated client');

			const requestBody: any = {
				memo_ids: dto.memo_ids,
				blueprint_id: dto.blueprint_id,
			};

			if (dto.custom_prompt) {
				requestBody.custom_prompt = dto.custom_prompt;
			}

			console.log('CombineMemosController - Request body:', requestBody);

			const { data, error: functionError } = await supabase.functions.invoke('combine-memos', {
				body: requestBody,
			});

			if (functionError) {
				console.error('CombineMemosController - Supabase function error:', functionError);
				throw new Error(`Memo combination failed: ${functionError.message}`);
			}

			console.log('CombineMemosController - Supabase function result:', data);

			const result = data;

			return {
				success: true,
				memo_id: result.memo_id,
				combined_memos_count: result.combined_memos_count,
				processed_prompts_count: result.processed_prompts_count,
				total_prompts_count: result.total_prompts_count,
				creditsConsumed: requiredCredits,
				creditType: creditResult.creditType,
			};
		} catch (error) {
			if (error instanceof InsufficientCreditsException) {
				throw error; // Let the exception propagate with 402 status
			}

			if (error.message?.includes('insufficient credits')) {
				// Fallback for any legacy insufficient credit errors
				throw new InsufficientCreditsException({
					requiredCredits,
					availableCredits: 0,
					creditType: 'user', // CombineMemosDto doesn't have space_id
					operation: 'combination',
				});
			}
			throw new BadRequestException(error.message);
		}
	}
}
