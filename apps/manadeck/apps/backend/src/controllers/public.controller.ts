import { Controller, Get, UseGuards, Query, Logger } from '@nestjs/common';
import { OptionalAuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser, Public } from '@mana-core/nestjs-integration/decorators';
import { DeckRepository, UserStatsRepository, DeckTemplateRepository } from '../database';

@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly deckRepository: DeckRepository,
    private readonly userStatsRepository: UserStatsRepository,
    private readonly deckTemplateRepository: DeckTemplateRepository,
  ) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date() };
  }

  @Public()
  @Get('version')
  version() {
    return {
      version: '1.0.0',
      service: 'manadeck-backend',
      environment: process.env.NODE_ENV,
    };
  }

  @UseGuards(OptionalAuthGuard)
  @Get('featured-decks')
  async getFeaturedDecks(@CurrentUser() user?: any) {
    const decks = await this.deckRepository.findFeatured(10);

    if (user) {
      this.logger.log(`Getting personalized featured decks for user: ${user.sub}`);
      return {
        type: 'personalized',
        userId: user.sub,
        decks,
        count: decks.length,
      };
    }

    this.logger.log('Getting generic featured decks');
    return {
      type: 'generic',
      decks,
      count: decks.length,
    };
  }

  @UseGuards(OptionalAuthGuard)
  @Get('leaderboard')
  async getLeaderboard(@CurrentUser() user?: any, @Query('limit') limit = '10') {
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const leaderboard = await this.userStatsRepository.getLeaderboard(limitNum);

    if (user) {
      this.logger.log(`Getting leaderboard with user ${user.sub} position`);
      const userPosition = await this.userStatsRepository.getUserPosition(user.sub);
      return {
        leaderboard,
        userPosition,
        userId: user.sub,
        limit: limitNum,
      };
    }

    return {
      leaderboard,
      limit: limitNum,
    };
  }

  @Public()
  @Get('deck-templates')
  async getDeckTemplates(@Query('category') category?: string) {
    const templates = category
      ? await this.deckTemplateRepository.findByCategory(category)
      : await this.deckTemplateRepository.findPublic();

    return {
      category: category || 'all',
      templates,
      count: templates.length,
    };
  }

  @Public()
  @Get('announcements')
  getAnnouncements() {
    return {
      announcements: [
        {
          id: '1',
          title: 'Welcome to ManaDeck!',
          content: 'Your deck management system is now powered by Mana Core authentication.',
          date: new Date(),
        },
      ],
    };
  }
}