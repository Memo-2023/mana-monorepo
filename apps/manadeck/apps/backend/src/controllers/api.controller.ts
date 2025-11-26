import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser } from '@mana-core/nestjs-integration/decorators';
import { CreditClientService } from '@mana-core/nestjs-integration';
import { isOk, CreditError, ServiceError } from '@manacore/shared-errors';
import {
  CreditOperationType,
  getCreditCost,
  getOperationDescription,
} from '../config/credit-operations';
import { DeckRepository, CardRepository, UserStatsRepository } from '../database';
import { AiService, CardType } from '../services/ai.service';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  private readonly logger = new Logger(ApiController.name);

  constructor(
    private readonly creditClient: CreditClientService,
    private readonly deckRepository: DeckRepository,
    private readonly cardRepository: CardRepository,
    private readonly userStatsRepository: UserStatsRepository,
    private readonly aiService: AiService,
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

    // Check if AI service is available
    if (!this.aiService.isAvailable()) {
      throw ServiceError.unavailable('AI');
    }

    // Validate request
    const {
      prompt,
      deckTitle,
      deckDescription,
      cardCount = 10,
      cardTypes,
      difficulty,
      tags,
      language,
    } = requestData;

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

    // Validate card types
    const validCardTypes: CardType[] = ['text', 'flashcard', 'quiz', 'mixed'];
    const requestedTypes: CardType[] = cardTypes || ['flashcard', 'quiz'];
    const invalidTypes = requestedTypes.filter((t) => !validCardTypes.includes(t));
    if (invalidTypes.length > 0) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: `Invalid card types: ${invalidTypes.join(', ')}. Valid types: ${validCardTypes.join(', ')}`,
      });
    }

    const operationType = CreditOperationType.AI_DECK_GENERATION;
    const creditCost = getCreditCost(operationType);

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

      throw new CreditError(
        creditCost,
        validation.availableCredits || 0,
        getOperationDescription(operationType),
      );
    }

    // 2. Generate cards with AI
    this.logger.log(`Generating ${cardCount} cards with AI for user ${user.sub}...`);
    const aiResult = await this.aiService.generateDeck({
      prompt,
      deckTitle,
      deckDescription,
      cardCount,
      cardTypes: requestedTypes,
      difficulty: difficulty || 'intermediate',
      language: language || 'en',
    });

    if (!isOk(aiResult)) {
      throw aiResult.error; // Caught by AppExceptionFilter
    }

    const { cards, metadata } = aiResult.value;

    // 3. Create deck in database
    const newDeck = await this.deckRepository.create({
      userId: user.sub,
      title: deckTitle,
      description: deckDescription,
      isPublic: false,
      settings: { aiGenerated: true, difficulty },
      tags: tags || [],
      metadata: {
        aiModel: metadata.model,
        generationTime: metadata.generationTime,
        prompt,
      },
    });

    // 4. Create cards in database
    const cardsToCreate = cards.map((card, index) => ({
      deckId: newDeck.id,
      title: card.title || `Card ${index + 1}`,
      content: card.content,
      cardType: card.cardType,
      position: index,
      aiModel: metadata.model,
      aiPrompt: prompt,
    }));

    await this.cardRepository.createMany(cardsToCreate);

    // 5. Consume credits
    await this.creditClient.consumeCredits(
      user.sub,
      operationType,
      creditCost,
      `Generated AI deck: ${deckTitle}`,
      {
        deckId: newDeck.id,
        deckTitle,
        cardCount: cards.length,
        prompt,
      },
    );

    this.logger.log(
      `AI deck generated successfully for user ${user.sub}. ` +
        `${cards.length} cards created in ${metadata.generationTime}ms. ` +
        `${creditCost} credits consumed.`,
    );

    return {
      success: true,
      userId: user.sub,
      deck: newDeck,
      cards,
      cardCount: cards.length,
      creditsUsed: creditCost,
      metadata,
      message: 'Deck generated successfully with AI',
    };
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