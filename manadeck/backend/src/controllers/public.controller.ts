import { Controller, Get, UseGuards, Query, Logger } from '@nestjs/common';
import { OptionalAuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser, Public } from '@mana-core/nestjs-integration/decorators';

@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

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
  getFeaturedDecks(@CurrentUser() user?: any) {
    // User might be authenticated or null
    if (user) {
      this.logger.log(`Getting personalized featured decks for user: ${user.sub}`);
      return {
        type: 'personalized',
        userId: user.sub,
        decks: [],
        message: 'Personalized featured decks based on user preferences',
      };
    }

    this.logger.log('Getting generic featured decks');
    return {
      type: 'generic',
      decks: [],
      message: 'Generic featured decks for anonymous users',
    };
  }

  @UseGuards(OptionalAuthGuard)
  @Get('leaderboard')
  getLeaderboard(@CurrentUser() user?: any, @Query('limit') limit = '10') {
    const limitNum = parseInt(limit, 10);

    if (user) {
      this.logger.log(`Getting leaderboard with user ${user.sub} position`);
      return {
        leaderboard: [],
        userPosition: null,
        userId: user.sub,
        limit: limitNum,
        message: 'Leaderboard with user position highlighted',
      };
    }

    return {
      leaderboard: [],
      limit: limitNum,
      message: 'Public leaderboard',
    };
  }

  @Public()
  @Get('deck-templates')
  getDeckTemplates(@Query('category') category?: string) {
    return {
      category: category || 'all',
      templates: [],
      message: 'Public deck templates available for all users',
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