import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger, BadRequestException, NotImplementedException } from '@nestjs/common';
import { AuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser } from '@mana-core/nestjs-integration/decorators';
import { CreditClientService } from '@mana-core/nestjs-integration';
import { CreditOperationType, getCreditCost, getOperationDescription } from '../config/credit-operations';
import { DeckRepository, CardRepository, UserStatsRepository } from '../database';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  private readonly logger = new Logger(ApiController.name);

  constructor(
    private readonly creditClient: CreditClientService,
    private readonly deckRepository: DeckRepository,
    private readonly cardRepository: CardRepository,
    private readonly userStatsRepository: UserStatsRepository,
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
  async getUserDecks(@CurrentUser() user: any) {
    this.logger.log(`Getting decks for user: ${user.sub}`);
    const decks = await this.deckRepository.findByUserId(user.sub);
    return {
      userId: user.sub,
      decks,
      count: decks.length,
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

      // 2. Perform the operation (create deck in PostgreSQL)
      const newDeck = await this.deckRepository.create({
        userId: user.sub,
        title: deckData.name || deckData.title || 'Untitled Deck',
        description: deckData.description,
        coverImageUrl: deckData.coverImageUrl,
        isPublic: deckData.isPublic ?? false,
        settings: deckData.settings || {},
        tags: deckData.tags || [],
        metadata: deckData.metadata || {},
      });

      // 3. Success - Consume credits
      await this.creditClient.consumeCredits(
        user.sub,
        operationType,
        creditCost,
        `Created deck: ${newDeck.title}`,
        {
          deckId: newDeck.id,
          deckName: newDeck.title,
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
  async generateDeckWithAI(@CurrentUser() user: any, @Body() requestData: any) {
    this.logger.log(`AI deck generation requested by user: ${user.sub}`);

    // TODO: Implement AI deck generation with a self-hosted solution
    // This endpoint previously used Supabase Edge Functions which are no longer available
    throw new NotImplementedException({
      error: 'not_implemented',
      message: 'AI deck generation is currently being migrated to a new infrastructure. Please check back later.',
    });
  }

  @Put('decks/:id')
  async updateDeck(
    @CurrentUser() user: any,
    @Param('id') deckId: string,
    @Body() deckData: any,
  ) {
    this.logger.log(`Updating deck ${deckId} for user: ${user.sub}`);

    const updatedDeck = await this.deckRepository.update(deckId, user.sub, {
      title: deckData.title,
      description: deckData.description,
      coverImageUrl: deckData.coverImageUrl,
      isPublic: deckData.isPublic,
      settings: deckData.settings,
      tags: deckData.tags,
      metadata: deckData.metadata,
    });

    if (!updatedDeck) {
      throw new BadRequestException({
        error: 'deck_not_found',
        message: 'Deck not found or you do not have permission to update it',
      });
    }

    return {
      success: true,
      userId: user.sub,
      deck: updatedDeck,
    };
  }

  @Delete('decks/:id')
  async deleteDeck(@CurrentUser() user: any, @Param('id') deckId: string) {
    this.logger.log(`Deleting deck ${deckId} for user: ${user.sub}`);

    const deleted = await this.deckRepository.delete(deckId, user.sub);

    if (!deleted) {
      throw new BadRequestException({
        error: 'deck_not_found',
        message: 'Deck not found or you do not have permission to delete it',
      });
    }

    return {
      success: true,
      userId: user.sub,
      deckId,
    };
  }

  @Get('cards')
  async getUserCards(@CurrentUser() user: any) {
    this.logger.log(`Getting cards for user: ${user.sub}`);
    const cards = await this.cardRepository.findByUserDecks(user.sub);
    return {
      userId: user.sub,
      cards,
      count: cards.length,
    };
  }

  @Post('cards')
  async createCard(@CurrentUser() user: any, @Body() cardData: any) {
    this.logger.log(`Creating card for user: ${user.sub}`);

    // Verify the deck belongs to the user
    const deck = await this.deckRepository.findByIdAndUserId(cardData.deckId, user.sub);
    if (!deck) {
      throw new BadRequestException({
        error: 'deck_not_found',
        message: 'Deck not found or you do not have permission to add cards to it',
      });
    }

    const card = await this.cardRepository.create({
      deckId: cardData.deckId,
      title: cardData.title,
      content: cardData.content,
      cardType: cardData.cardType || 'flashcard',
      position: cardData.position ?? 0,
      aiModel: cardData.aiModel,
      aiPrompt: cardData.aiPrompt,
    });

    return {
      success: true,
      userId: user.sub,
      card,
    };
  }

  @Get('stats')
  async getUserStats(@CurrentUser() user: any) {
    this.logger.log(`Getting stats for user: ${user.sub}`);

    const [stats, totalDecks, totalCards] = await Promise.all([
      this.userStatsRepository.findOrCreate(user.sub),
      this.deckRepository.countByUserId(user.sub),
      this.cardRepository.countByUserId(user.sub),
    ]);

    return {
      userId: user.sub,
      stats: {
        ...stats,
        totalDecks,
        totalCards,
      },
    };
  }
}