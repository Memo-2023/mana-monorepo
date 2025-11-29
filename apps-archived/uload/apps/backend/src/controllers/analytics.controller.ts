import {
	Controller,
	Get,
	Param,
	Query,
	UseGuards,
	NotFoundException,
	ForbiddenException,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';
import { AnalyticsService } from '../services/analytics.service';
import { LinksService } from '../services/links.service';

@Controller('api/analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
	constructor(
		private readonly analyticsService: AnalyticsService,
		private readonly linksService: LinksService
	) {}

	@Get('links/:linkId')
	async getLinkAnalytics(
		@CurrentUser() user: any,
		@Param('linkId') linkId: string,
		@Query('from') fromDate?: string,
		@Query('to') toDate?: string
	) {
		const userId = user.sub;

		// Verify user owns the link
		const link = await this.linksService.getLinkById(linkId, userId);
		if (!link) {
			throw new NotFoundException('Link not found');
		}

		const stats = await this.analyticsService.getStats(
			linkId,
			fromDate ? new Date(fromDate) : undefined,
			toDate ? new Date(toDate) : undefined
		);

		return {
			success: true,
			data: {
				linkId,
				shortCode: link.shortCode,
				stats,
			},
		};
	}

	@Get('links/:linkId/clicks')
	async getLinkClicks(
		@CurrentUser() user: any,
		@Param('linkId') linkId: string,
		@Query('limit') limit: number = 100
	) {
		const userId = user.sub;

		// Verify user owns the link
		const link = await this.linksService.getLinkById(linkId, userId);
		if (!link) {
			throw new NotFoundException('Link not found');
		}

		const { clicks, total } = await this.analyticsService.getRecentClicks(linkId, limit);

		return {
			success: true,
			data: {
				linkId,
				clicks: clicks.map((click) => ({
					...click,
					ipHash: undefined, // Don't expose IP hash
				})),
				total,
			},
		};
	}

	@Get('overview')
	async getOverview(@CurrentUser() user: any) {
		const userId = user.sub;
		const totalLinks = await this.linksService.getLinkCount(userId);

		return {
			success: true,
			data: {
				totalLinks,
				// Add more overview stats as needed
			},
		};
	}
}
