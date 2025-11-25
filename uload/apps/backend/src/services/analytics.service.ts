import { Injectable, Logger } from '@nestjs/common';
import * as UAParser from 'ua-parser-js';
import { ClickRepository, type ClickStats } from '../database/repositories';
import { RedirectService } from './redirect.service';
import type { NewClick } from '@manacore/uload-database';

export interface RecordClickData {
  userAgent: string;
  referer?: string;
  ip?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly clickRepository: ClickRepository,
    private readonly redirectService: RedirectService,
  ) {}

  async recordClick(linkId: string, data: RecordClickData): Promise<void> {
    try {
      // Parse user agent
      const parser = new UAParser.UAParser(data.userAgent);
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const device = parser.getDevice();

      // Hash IP for privacy
      const ipHash = data.ip ? this.hashIp(data.ip) : null;

      // Determine device type
      let deviceType = 'desktop';
      if (device.type === 'mobile') {
        deviceType = 'mobile';
      } else if (device.type === 'tablet') {
        deviceType = 'tablet';
      }

      const clickData: NewClick = {
        linkId,
        ipHash,
        userAgent: data.userAgent,
        referer: data.referer,
        browser: browser.name || 'Unknown',
        deviceType,
        os: os.name || 'Unknown',
        // TODO: Geo lookup from IP
        country: null,
        city: null,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
      };

      await this.clickRepository.create(clickData);

      // Increment click count on the link
      await this.redirectService.incrementClickCount(linkId);

      this.logger.debug(`Recorded click for link ${linkId}`);
    } catch (error) {
      this.logger.error(`Failed to record click for link ${linkId}:`, error);
      // Don't throw - click recording should not block redirect
    }
  }

  async getStats(
    linkId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<ClickStats> {
    return this.clickRepository.getStats(linkId, fromDate, toDate);
  }

  async getRecentClicks(
    linkId: string,
    limit: number = 100,
  ): Promise<{ clicks: any[]; total: number }> {
    const [clicks, total] = await Promise.all([
      this.clickRepository.findByLinkId(linkId, { limit }),
      this.clickRepository.countByLinkId(linkId),
    ]);

    return { clicks, total };
  }

  private hashIp(ip: string): string {
    // Simple hash for privacy - in production use a proper hash function
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}
