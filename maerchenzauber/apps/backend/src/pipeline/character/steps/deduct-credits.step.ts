import { PipelineStep } from '../../core/pipeline.types';
import {
  CharacterDatabaseOutput,
  CharacterCreditOutput,
} from '../types/character-pipeline.types';

// Mock credit deduction - replace with actual Mana Core API call
async function deductCreditsFromManaCore(
  userId: string,
  amount: number,
  description: string,
): Promise<{ transactionId: string; remainingCredits: number }> {
  // In real implementation:
  // const result = await manaCore.deductCredits({
  //   userId,
  //   amount,
  //   description,
  //   service: 'character-creation'
  // });

  return {
    transactionId: `txn_${Date.now()}`,
    remainingCredits: Math.max(0, Math.floor(Math.random() * 100)),
  };
}

export const deductCreditsStep: PipelineStep<
  CharacterDatabaseOutput,
  CharacterCreditOutput
> = {
  name: 'deduct-credits',
  category: 'character',
  description: 'Deducts credits from user account via Mana Core',
  timeout: 10000,
  retryable: true,
  maxRetries: 2,

  execute: async (input, context) => {
    const creditsToDeduct = input.estimatedCredits || 10;

    try {
      console.log(
        `[Credit Deduction] Deducting ${creditsToDeduct} credits for character creation`,
      );

      const creditResult = await deductCreditsFromManaCore(
        input.userId,
        creditsToDeduct,
        `Character creation: ${input.sanitizedName}`,
      );

      return {
        ...input,
        creditsDeducted: creditsToDeduct,
        remainingCredits: creditResult.remainingCredits,
        transactionId: creditResult.transactionId,
      };
    } catch (error) {
      // If credit deduction fails, we should rollback the character creation
      throw new Error(`Failed to deduct credits: ${(error as Error).message}`);
    }
  },

  rollback: async (input, error, context) => {
    if ('transactionId' in input && input.transactionId) {
      console.log(
        `[Rollback] deduct-credits: Refunding transaction ${input.transactionId}`,
      );
      // await manaCore.refundCredits({ transactionId: input.transactionId });
    }
  },
};
