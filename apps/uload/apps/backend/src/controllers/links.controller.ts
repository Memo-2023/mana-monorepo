import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';
import { LinksService, type CreateLinkDto, type UpdateLinkDto } from '../services/links.service';

@Controller('api/links')
@UseGuards(AuthGuard)
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  async getLinks(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const userId = user.sub;
    const { items, total } = await this.linksService.getLinks(userId, {
      page,
      limit,
      search,
      isActive,
    });

    return {
      success: true,
      data: {
        links: items.map((link) => ({
          ...link,
          shortUrl: this.linksService.getShortUrl(link.shortCode),
          hasPassword: !!link.password,
          password: undefined, // Never send password to client
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  }

  @Get(':id')
  async getLink(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = user.sub;
    const link = await this.linksService.getLinkById(id, userId);

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    return {
      success: true,
      data: {
        ...link,
        shortUrl: this.linksService.getShortUrl(link.shortCode),
        hasPassword: !!link.password,
        password: undefined,
      },
    };
  }

  @Post()
  async createLink(@CurrentUser() user: any, @Body() dto: CreateLinkDto) {
    const userId = user.sub;
    const link = await this.linksService.createLink(userId, dto);

    return {
      success: true,
      data: {
        ...link,
        shortUrl: this.linksService.getShortUrl(link.shortCode),
        hasPassword: !!link.password,
        password: undefined,
      },
    };
  }

  @Patch(':id')
  async updateLink(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLinkDto,
  ) {
    const userId = user.sub;
    const link = await this.linksService.updateLink(id, userId, dto);

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    return {
      success: true,
      data: {
        ...link,
        shortUrl: this.linksService.getShortUrl(link.shortCode),
        hasPassword: !!link.password,
        password: undefined,
      },
    };
  }

  @Delete(':id')
  async deleteLink(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = user.sub;
    const deleted = await this.linksService.deleteLink(id, userId);

    if (!deleted) {
      throw new NotFoundException('Link not found');
    }

    return {
      success: true,
      message: 'Link deleted successfully',
    };
  }
}
