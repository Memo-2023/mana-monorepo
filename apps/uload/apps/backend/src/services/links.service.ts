import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { LinkRepository, type ListLinksOptions } from '../database/repositories';
import type { Link, NewLink } from '@manacore/uload-database';

export interface CreateLinkDto {
  originalUrl: string;
  customCode?: string;
  title?: string;
  description?: string;
  password?: string;
  maxClicks?: number;
  expiresAt?: Date;
  tags?: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  workspaceId?: string;
}

export interface UpdateLinkDto {
  title?: string;
  description?: string;
  password?: string;
  maxClicks?: number;
  expiresAt?: Date;
  isActive?: boolean;
  tags?: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);
  private readonly shortUrlBase: string;

  constructor(
    private readonly linkRepository: LinkRepository,
    private readonly configService: ConfigService,
  ) {
    this.shortUrlBase = this.configService.get('SHORT_URL_BASE', 'https://ulo.ad');
  }

  async createLink(userId: string, dto: CreateLinkDto): Promise<Link> {
    // Generate or validate short code
    let shortCode = dto.customCode;

    if (shortCode) {
      // Validate custom code format
      if (!/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
        throw new BadRequestException(
          'Custom code can only contain letters, numbers, hyphens and underscores',
        );
      }

      // Check if custom code is available
      const isAvailable = await this.linkRepository.isShortCodeAvailable(shortCode);
      if (!isAvailable) {
        throw new BadRequestException('This custom code is already taken');
      }
    } else {
      // Generate random short code
      shortCode = nanoid(7);

      // Make sure it's unique (very unlikely to collide, but check anyway)
      let attempts = 0;
      while (
        !(await this.linkRepository.isShortCodeAvailable(shortCode)) &&
        attempts < 5
      ) {
        shortCode = nanoid(7);
        attempts++;
      }
    }

    const newLink: NewLink = {
      shortCode,
      customCode: dto.customCode,
      originalUrl: dto.originalUrl,
      title: dto.title,
      description: dto.description,
      userId,
      password: dto.password, // TODO: Hash password if provided
      maxClicks: dto.maxClicks,
      expiresAt: dto.expiresAt,
      tags: dto.tags,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      workspaceId: dto.workspaceId,
    };

    const link = await this.linkRepository.create(newLink);
    this.logger.log(`Created link ${link.shortCode} for user ${userId}`);

    return link;
  }

  async updateLink(
    id: string,
    userId: string,
    dto: UpdateLinkDto,
  ): Promise<Link | null> {
    const link = await this.linkRepository.update(id, userId, dto);

    if (link) {
      this.logger.log(`Updated link ${link.shortCode} for user ${userId}`);
    }

    return link;
  }

  async deleteLink(id: string, userId: string): Promise<boolean> {
    const deleted = await this.linkRepository.delete(id, userId);

    if (deleted) {
      this.logger.log(`Deleted link ${id} for user ${userId}`);
    }

    return deleted;
  }

  async getLinkById(id: string, userId: string): Promise<Link | null> {
    return this.linkRepository.findByIdAndUserId(id, userId);
  }

  async getLinks(
    userId: string,
    options: ListLinksOptions,
  ): Promise<{ items: Link[]; total: number }> {
    return this.linkRepository.findByUserId(userId, options);
  }

  async getLinkCount(userId: string): Promise<number> {
    return this.linkRepository.countByUserId(userId);
  }

  getShortUrl(shortCode: string): string {
    return `${this.shortUrlBase}/${shortCode}`;
  }
}
