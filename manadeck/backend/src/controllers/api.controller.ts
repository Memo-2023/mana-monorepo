import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger, BadRequestException, Req } from '@nestjs/common';
import { AuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser } from '@mana-core/nestjs-integration/decorators';
import { CreditClientService } from '@mana-core/nestjs-integration';
import { CreditOperationType, getCreditCost, getOperationDescription } from '../config/credit-operations';
import { SupabaseService } from '../services/supabase.service';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  private readonly logger = new Logger(ApiController.name);

  constructor(
    private readonly creditClient: CreditClientService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    this.logger.log(`Getting profile for user: ${user.sub}`);

    // Include credit balance in profile
    let creditBalance = 0;
    try {
      const balance = await this.creditClient.getCreditBalance(user.sub);
      creditBalance = balance.balance || 0;
    } catch (error) {
      this.logger.warn(`Failed to fetch credit balance for user ${user.sub}:`, error);
    }

    return {
      user,
      credits: creditBalance,
      timestamp: new Date(),
    };
  }

  @Get('credits/balance')
  async getCreditBalance(@CurrentUser() user: any) {
    this.logger.log(`Getting credit balance for user: ${user.sub}`);

    try {
      const balance = await this.creditClient.getCreditBalance(user.sub);

      return {
        userId: user.sub,
        balance: balance.balance || 0,
        currency: 'mana',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error fetching credit balance for user ${user.sub}:`, error);
      throw new BadRequestException({
        error: 'credit_balance_fetch_failed',
        message: 'Failed to retrieve credit balance',
      });
    }
  }

  @Get('decks')
  getUserDecks(@CurrentUser() user: any) {
    // This would fetch from Supabase in a real implementation
    return {
      userId: user.sub,
      decks: [],
      message: 'Fetch user decks from Supabase',
    };
  }

  @Post('decks')
  async createDeck(@CurrentUser() user: any, @Body() deckData: any) {
    this.logger.log(`Creating deck for user: ${user.sub}`);

    const operationType = CreditOperationType.DECK_CREATION;
    const creditCost = getCreditCost(operationType);

    try {
      // 1. Pre-flight credit validation
      const validation = await this.creditClient.validateCredits(
        user.sub,
        operationType,
        creditCost,
      );

      if (!validation.hasCredits) {
        this.logger.warn(
          `User ${user.sub} has insufficient credits. Required: ${creditCost}, Available: ${validation.availableCredits}`,
        );

        throw new BadRequestException({
          error: 'insufficient_credits',
          message: `Insufficient mana. Required: ${creditCost}, Available: ${validation.availableCredits}`,
          requiredCredits: creditCost,
          availableCredits: validation.availableCredits,
          operation: getOperationDescription(operationType),
        });
      }

      // 2. Perform the operation (create deck in Supabase)
      // TODO: Implement actual deck creation logic with Supabase
      const newDeck = {
        id: `deck_${Date.now()}`,
        ...deckData,
        userId: user.sub,
        createdAt: new Date(),
      };

      // 3. Success - Consume credits
      await this.creditClient.consumeCredits(
        user.sub,
        operationType,
        creditCost,
        `Created deck: ${deckData.name || 'Unnamed Deck'}`,
        {
          deckId: newDeck.id,
          deckName: deckData.name,
        },
      );

      this.logger.log(`Deck created successfully for user ${user.sub}. ${creditCost} credits consumed.`);

      return {
        success: true,
        userId: user.sub,
        deck: newDeck,
        creditsUsed: creditCost,
        message: 'Deck created successfully',
      };
    } catch (error) {
      // If it's already a BadRequestException (insufficient credits), rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log other errors
      this.logger.error(`Error creating deck for user ${user.sub}:`, error);
      throw new BadRequestException({
        error: 'deck_creation_failed',
        message: error.message || 'Failed to create deck',
      });
    }
  }

  @Post('decks/generate')
  async generateDeckWithAI(@CurrentUser() user: any, @Body() requestData: any, @Req() req: any) {
    this.logger.log(`Generating AI deck for user: ${user.sub}`);

    const { prompt, deckTitle, deckDescription, cardCount = 10, cardTypes, difficulty, tags } = requestData;

    // Validate required fields
    if (!prompt || !deckTitle) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'prompt and deckTitle are required',
      });
    }

    if (cardCount < 1 || cardCount > 50) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'cardCount must be between 1 and 50',
      });
    }

    const operationType = CreditOperationType.AI_DECK_GENERATION;
    const creditCost = getCreditCost(operationType);

    try {
      // 1. Pre-flight credit validation
      const validation = await this.creditClient.validateCredits(
        user.sub,
        operationType,
        creditCost,
      );

      if (!validation.hasCredits) {
        this.logger.warn(
          `User ${user.sub} has insufficient credits for AI deck generation. Required: ${creditCost}, Available: ${validation.availableCredits}`,
        );

        throw new BadRequestException({
          error: 'insufficient_credits',
          message: `Insufficient mana. Required: ${creditCost}, Available: ${validation.availableCredits}`,
          requiredCredits: creditCost,
          availableCredits: validation.availableCredits,
          operation: getOperationDescription(operationType),
        });
      }

      // 2. Get the Mana token from the request
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new BadRequestException({
          error: 'authentication_failed',
          message: 'No authorization token found',
        });
      }
      const manaToken = authHeader.replace('Bearer ', '');

      // 3. Call the edge function via Supabase
      const result = await this.supabaseService.generateDeckWithAI(
        user.sub,
        {
          prompt,
          deckTitle,
          deckDescription,
          cardCount,
          cardTypes,
          difficulty,
          tags,
        },
        manaToken,
      );

      // 4. Check if the edge function was successful
      if (!result.success) {
        throw new BadRequestException({
          error: 'deck_generation_failed',
          message: result.error || 'Failed to generate deck',
        });
      }

      // 5. Success - Consume credits
      await this.creditClient.consumeCredits(
        user.sub,
        operationType,
        creditCost,
        `Generated AI deck: ${deckTitle}`,
        {
          deckId: result.deck?.id,
          deckTitle,
          cardCount: result.deck?.card_count,
          prompt,
        },
      );

      this.logger.log(`AI deck generated successfully for user ${user.sub}. ${creditCost} credits consumed.`);

      return {
        success: true,
        userId: user.sub,
        deck: result.deck,
        cards: result.cards,
        creditsUsed: creditCost,
        message: result.message || 'Deck generated successfully with AI',
      };
    } catch (error) {
      // If it's already a BadRequestException, rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log other errors
      this.logger.error(`Error generating AI deck for user ${user.sub}:`, error);
      throw new BadRequestException({
        error: 'deck_generation_failed',
        message: error.message || 'Failed to generate deck with AI',
      });
    }
  }

  @Put('decks/:id')
  updateDeck(
    @CurrentUser() user: any,
    @Param('id') deckId: string,
    @Body() deckData: any,
  ) {
    this.logger.log(`Updating deck ${deckId} for user: ${user.sub}`);
    return {
      userId: user.sub,
      deckId,
      deck: deckData,
      message: 'Deck would be updated in Supabase',
    };
  }

  @Delete('decks/:id')
  deleteDeck(@CurrentUser() user: any, @Param('id') deckId: string) {
    this.logger.log(`Deleting deck ${deckId} for user: ${user.sub}`);
    return {
      userId: user.sub,
      deckId,
      message: 'Deck would be deleted from Supabase',
    };
  }

  @Get('cards')
  getUserCards(@CurrentUser() user: any) {
    return {
      userId: user.sub,
      cards: [],
      message: 'Fetch user cards from Supabase',
    };
  }

  @Post('cards')
  createCard(@CurrentUser() user: any, @Body() cardData: any) {
    this.logger.log(`Creating card for user: ${user.sub}`);
    return {
      userId: user.sub,
      card: cardData,
      message: 'Card would be created in Supabase',
    };
  }

  @Get('stats')
  getUserStats(@CurrentUser() user: any) {
    return {
      userId: user.sub,
      stats: {
        totalDecks: 0,
        totalCards: 0,
        lastActive: new Date(),
      },
      message: 'Fetch user stats from Supabase',
    };
  }
}