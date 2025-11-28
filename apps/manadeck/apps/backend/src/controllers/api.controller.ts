import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
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
import {
	DeckRepository,
	CardRepository,
	UserStatsRepository,
	StudySessionRepository,
	CardProgressRepository,
} from '../database';
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
		private readonly studySessionRepository: StudySessionRepository,
		private readonly cardProgressRepository: CardProgressRepository,
		private readonly aiService: AiService
	) {}

	@Get('profile')
	async getProfile(@CurrentUser() user: any) {
		this.logger.log(`Getting profile for user: ${user.sub}`);

		// Include credit balance in profile
		let creditBalance = 0;
		try {
			const balance = await this.creditClient.getBalance(user.sub);
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
			const balance = await this.creditClient.getBalance(user.sub);

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
				creditCost
			);

			if (!validation.hasCredits) {
				this.logger.warn(
					`User ${user.sub} has insufficient credits. Required: ${creditCost}, Available: ${validation.availableCredits}`
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
				}
			);

			this.logger.log(
				`Deck created successfully for user ${user.sub}. ${creditCost} credits consumed.`
			);

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
		const validation = await this.creditClient.validateCredits(user.sub, operationType, creditCost);

		if (!validation.hasCredits) {
			this.logger.warn(
				`User ${user.sub} has insufficient credits for AI deck generation. Required: ${creditCost}, Available: ${validation.availableCredits}`
			);

			throw new CreditError(
				creditCost,
				validation.availableCredits || 0,
				getOperationDescription(operationType)
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
			}
		);

		this.logger.log(
			`AI deck generated successfully for user ${user.sub}. ` +
				`${cards.length} cards created in ${metadata.generationTime}ms. ` +
				`${creditCost} credits consumed.`
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
	async updateDeck(@CurrentUser() user: any, @Param('id') deckId: string, @Body() deckData: any) {
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

	@Get('decks/:id')
	async getDeck(@CurrentUser() user: any, @Param('id') deckId: string) {
		this.logger.log(`Getting deck ${deckId} for user: ${user.sub}`);

		const deck = await this.deckRepository.findByIdAndUserId(deckId, user.sub);

		if (!deck) {
			throw new BadRequestException({
				error: 'deck_not_found',
				message: 'Deck not found or you do not have permission to view it',
			});
		}

		// Get card count
		const cardCount = await this.cardRepository.countByDeckId(deckId);

		return {
			userId: user.sub,
			deck: {
				...deck,
				card_count: cardCount,
			},
		};
	}

	@Get('decks/:id/cards')
	async getDeckCards(@CurrentUser() user: any, @Param('id') deckId: string) {
		this.logger.log(`Getting cards for deck ${deckId}, user: ${user.sub}`);

		// Verify deck ownership
		const deck = await this.deckRepository.findByIdAndUserId(deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'deck_not_found',
				message: 'Deck not found or you do not have permission to view it',
			});
		}

		const cards = await this.cardRepository.findByDeckId(deckId);

		return {
			userId: user.sub,
			deckId,
			cards,
			count: cards.length,
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

	@Get('cards/:id')
	async getCard(@CurrentUser() user: any, @Param('id') cardId: string) {
		this.logger.log(`Getting card ${cardId} for user: ${user.sub}`);

		const card = await this.cardRepository.findById(cardId);

		if (!card) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found',
			});
		}

		// Verify ownership via deck
		const deck = await this.deckRepository.findByIdAndUserId(card.deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found or you do not have permission to view it',
			});
		}

		return {
			userId: user.sub,
			card,
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

	@Put('cards/:id')
	async updateCard(@CurrentUser() user: any, @Param('id') cardId: string, @Body() cardData: any) {
		this.logger.log(`Updating card ${cardId} for user: ${user.sub}`);

		// Get the card first
		const existingCard = await this.cardRepository.findById(cardId);
		if (!existingCard) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found',
			});
		}

		// Verify ownership via deck
		const deck = await this.deckRepository.findByIdAndUserId(existingCard.deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found or you do not have permission to update it',
			});
		}

		const updatedCard = await this.cardRepository.update(cardId, {
			title: cardData.title,
			content: cardData.content,
			cardType: cardData.cardType,
			position: cardData.position,
			isFavorite: cardData.isFavorite,
		});

		return {
			success: true,
			userId: user.sub,
			card: updatedCard,
		};
	}

	@Delete('cards/:id')
	async deleteCard(@CurrentUser() user: any, @Param('id') cardId: string) {
		this.logger.log(`Deleting card ${cardId} for user: ${user.sub}`);

		// Get the card first
		const existingCard = await this.cardRepository.findById(cardId);
		if (!existingCard) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found',
			});
		}

		// Verify ownership via deck
		const deck = await this.deckRepository.findByIdAndUserId(existingCard.deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found or you do not have permission to delete it',
			});
		}

		await this.cardRepository.delete(cardId);

		return {
			success: true,
			userId: user.sub,
			cardId,
		};
	}

	@Post('cards/reorder')
	async reorderCards(
		@CurrentUser() user: any,
		@Body() reorderData: { deckId: string; cardIds: string[] }
	) {
		this.logger.log(`Reordering cards in deck ${reorderData.deckId} for user: ${user.sub}`);

		// Verify deck ownership
		const deck = await this.deckRepository.findByIdAndUserId(reorderData.deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'deck_not_found',
				message: 'Deck not found or you do not have permission to modify it',
			});
		}

		// Update positions
		for (let i = 0; i < reorderData.cardIds.length; i++) {
			await this.cardRepository.update(reorderData.cardIds[i], { position: i });
		}

		return {
			success: true,
			userId: user.sub,
			deckId: reorderData.deckId,
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

	// ============ Study Sessions ============

	@Get('study-sessions')
	async getStudySessions(@CurrentUser() user: any) {
		this.logger.log(`Getting study sessions for user: ${user.sub}`);
		const sessions = await this.studySessionRepository.findByUserId(user.sub);
		return {
			userId: user.sub,
			sessions,
			count: sessions.length,
		};
	}

	@Get('study-sessions/stats')
	async getStudySessionStats(@CurrentUser() user: any) {
		this.logger.log(`Getting study session stats for user: ${user.sub}`);
		const stats = await this.studySessionRepository.getStatsByUserId(user.sub);
		return {
			userId: user.sub,
			stats,
		};
	}

	@Get('study-sessions/range')
	async getStudySessionsByDateRange(
		@CurrentUser() user: any,
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string
	) {
		this.logger.log(`Getting study sessions for user ${user.sub} from ${startDate} to ${endDate}`);

		if (!startDate || !endDate) {
			throw new BadRequestException({
				error: 'validation_failed',
				message: 'startDate and endDate query parameters are required',
			});
		}

		const sessions = await this.studySessionRepository.findByDateRange(
			user.sub,
			new Date(startDate),
			new Date(endDate)
		);

		return {
			userId: user.sub,
			sessions,
			count: sessions.length,
			startDate,
			endDate,
		};
	}

	@Get('study-sessions/deck/:deckId')
	async getStudySessionsByDeck(@CurrentUser() user: any, @Param('deckId') deckId: string) {
		this.logger.log(`Getting study sessions for deck ${deckId}, user: ${user.sub}`);

		// Verify deck ownership
		const deck = await this.deckRepository.findByIdAndUserId(deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'deck_not_found',
				message: 'Deck not found or you do not have permission to view it',
			});
		}

		const sessions = await this.studySessionRepository.findByDeckId(deckId, user.sub);
		return {
			userId: user.sub,
			deckId,
			sessions,
			count: sessions.length,
		};
	}

	@Get('study-sessions/:id')
	async getStudySession(@CurrentUser() user: any, @Param('id') sessionId: string) {
		this.logger.log(`Getting study session ${sessionId} for user: ${user.sub}`);

		const session = await this.studySessionRepository.findById(sessionId);
		if (!session || session.userId !== user.sub) {
			throw new BadRequestException({
				error: 'session_not_found',
				message: 'Study session not found',
			});
		}

		return {
			userId: user.sub,
			session,
		};
	}

	@Post('study-sessions')
	async createStudySession(@CurrentUser() user: any, @Body() sessionData: any) {
		this.logger.log(`Creating study session for user: ${user.sub}`);

		// Verify deck ownership
		const deck = await this.deckRepository.findByIdAndUserId(sessionData.deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'deck_not_found',
				message: 'Deck not found or you do not have permission to create sessions for it',
			});
		}

		const session = await this.studySessionRepository.create({
			userId: user.sub,
			deckId: sessionData.deckId,
			mode: sessionData.mode || 'all',
			startedAt: sessionData.startedAt || new Date(),
			completedAt: sessionData.endedAt,
			totalCards: sessionData.totalCards || 0,
			completedCards: sessionData.completedCards || 0,
			correctCards: sessionData.correctCards || 0,
			timeSpentSeconds: sessionData.timeSpentSeconds || 0,
		});

		return {
			success: true,
			userId: user.sub,
			session,
		};
	}

	@Put('study-sessions/:id')
	async updateStudySession(
		@CurrentUser() user: any,
		@Param('id') sessionId: string,
		@Body() sessionData: any
	) {
		this.logger.log(`Updating study session ${sessionId} for user: ${user.sub}`);

		const session = await this.studySessionRepository.update(sessionId, user.sub, {
			completedAt: sessionData.endedAt,
			totalCards: sessionData.totalCards,
			completedCards: sessionData.completedCards,
			correctCards: sessionData.correctCards,
			timeSpentSeconds: sessionData.timeSpentSeconds,
		});

		if (!session) {
			throw new BadRequestException({
				error: 'session_not_found',
				message: 'Study session not found or you do not have permission to update it',
			});
		}

		return {
			success: true,
			userId: user.sub,
			session,
		};
	}

	// ============ Card Progress ============

	@Get('progress')
	async getCardProgress(@CurrentUser() user: any) {
		this.logger.log(`Getting card progress for user: ${user.sub}`);
		const progress = await this.cardProgressRepository.findByUserId(user.sub);
		return {
			userId: user.sub,
			progress,
			count: progress.length,
		};
	}

	@Get('progress/stats')
	async getCardProgressStats(@CurrentUser() user: any) {
		this.logger.log(`Getting card progress stats for user: ${user.sub}`);
		const stats = await this.cardProgressRepository.getStatsByUserId(user.sub);
		return {
			userId: user.sub,
			stats,
		};
	}

	@Get('progress/due')
	async getDueCards(@CurrentUser() user: any) {
		this.logger.log(`Getting due cards for user: ${user.sub}`);
		const dueProgress = await this.cardProgressRepository.findDueCards(user.sub);
		return {
			userId: user.sub,
			progress: dueProgress,
			count: dueProgress.length,
		};
	}

	@Get('progress/deck/:deckId')
	async getCardProgressByDeck(@CurrentUser() user: any, @Param('deckId') deckId: string) {
		this.logger.log(`Getting card progress for deck ${deckId}, user: ${user.sub}`);

		// Verify deck ownership
		const deck = await this.deckRepository.findByIdAndUserId(deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'deck_not_found',
				message: 'Deck not found or you do not have permission to view it',
			});
		}

		const progress = await this.cardProgressRepository.findByDeckId(deckId, user.sub);
		return {
			userId: user.sub,
			deckId,
			progress,
			count: progress.length,
		};
	}

	@Get('progress/deck/:deckId/due')
	async getDueCardsByDeck(@CurrentUser() user: any, @Param('deckId') deckId: string) {
		this.logger.log(`Getting due cards for deck ${deckId}, user: ${user.sub}`);

		// Verify deck ownership
		const deck = await this.deckRepository.findByIdAndUserId(deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'deck_not_found',
				message: 'Deck not found or you do not have permission to view it',
			});
		}

		const dueProgress = await this.cardProgressRepository.findDueCards(user.sub, deckId);
		return {
			userId: user.sub,
			deckId,
			progress: dueProgress,
			count: dueProgress.length,
		};
	}

	@Get('progress/card/:cardId')
	async getCardProgressByCard(@CurrentUser() user: any, @Param('cardId') cardId: string) {
		this.logger.log(`Getting progress for card ${cardId}, user: ${user.sub}`);

		// Verify card ownership via deck
		const card = await this.cardRepository.findById(cardId);
		if (!card) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found',
			});
		}

		const deck = await this.deckRepository.findByIdAndUserId(card.deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found or you do not have permission to view it',
			});
		}

		const progress = await this.cardProgressRepository.findByCardId(cardId, user.sub);
		return {
			userId: user.sub,
			cardId,
			progress,
		};
	}

	@Post('progress')
	async upsertCardProgress(@CurrentUser() user: any, @Body() progressData: any) {
		this.logger.log(`Upserting card progress for user: ${user.sub}`);

		// Verify card ownership via deck
		const card = await this.cardRepository.findById(progressData.cardId);
		if (!card) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found',
			});
		}

		const deck = await this.deckRepository.findByIdAndUserId(card.deckId, user.sub);
		if (!deck) {
			throw new BadRequestException({
				error: 'card_not_found',
				message: 'Card not found or you do not have permission to update progress for it',
			});
		}

		const progress = await this.cardProgressRepository.upsert({
			userId: user.sub,
			cardId: progressData.cardId,
			easeFactor: progressData.easeFactor ?? 2.5,
			interval: progressData.interval ?? 0,
			repetitions: progressData.repetitions ?? 0,
			lastReviewed: progressData.lastReviewed ? new Date(progressData.lastReviewed) : new Date(),
			nextReview: progressData.nextReview ? new Date(progressData.nextReview) : new Date(),
			status: progressData.status || 'new',
		});

		return {
			success: true,
			userId: user.sub,
			progress,
		};
	}

	// ============ AI Operations ============

	@Post('ai/generate-from-image')
	async generateCardsFromImage(@CurrentUser() user: any, @Body() body: any) {
		this.logger.log(`Generating cards from image for user: ${user.sub}`);

		const { image, context, cardCount = 5 } = body;

		if (!image) {
			throw new BadRequestException({
				error: 'validation_failed',
				message: 'image (base64) is required',
			});
		}

		const result = await this.aiService.generateFromImage(image, context, cardCount);

		if (!isOk(result)) {
			throw new BadRequestException({
				error: 'ai_generation_failed',
				message: result.error.message,
			});
		}

		return {
			success: true,
			userId: user.sub,
			cards: result.value.cards.map((card) => ({
				type: card.cardType,
				content: card.content,
				metadata: {
					confidence: 1,
					source: 'ai-image',
					tags: [],
				},
			})),
			metadata: result.value.metadata,
		};
	}

	@Post('ai/enhance-content')
	async enhanceCardContent(@CurrentUser() user: any, @Body() body: any) {
		this.logger.log(`Enhancing card content for user: ${user.sub}`);

		const { content, cardType } = body;

		if (!content) {
			throw new BadRequestException({
				error: 'validation_failed',
				message: 'content is required',
			});
		}

		const result = await this.aiService.enhanceContent(content, cardType || 'flashcard');

		if (!isOk(result)) {
			throw new BadRequestException({
				error: 'ai_enhancement_failed',
				message: result.error.message,
			});
		}

		return {
			success: true,
			userId: user.sub,
			enhancedContent: result.value.enhancedContent,
		};
	}
}
