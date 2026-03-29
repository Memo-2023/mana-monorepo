import { Controller, Get, Post, Param, Body, Req, Res, HttpStatus, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import { RedirectService } from '../services/redirect.service';
import { AnalyticsService } from '../services/analytics.service';

@Controller()
export class RedirectController {
	constructor(
		private readonly redirectService: RedirectService,
		private readonly analyticsService: AnalyticsService
	) {}

	@Get(':code')
	async redirect(
		@Param('code') code: string,
		@Query('utm_source') utmSource: string,
		@Query('utm_medium') utmMedium: string,
		@Query('utm_campaign') utmCampaign: string,
		@Req() request: Request,
		@Res() response: Response
	) {
		// Skip for API and health routes
		if (code === 'v1' || code === 'health') {
			return response.status(HttpStatus.NOT_FOUND).json({
				success: false,
				error: 'not_found',
			});
		}

		const result = await this.redirectService.getRedirect(code);

		if (!result.success) {
			switch (result.error) {
				case 'not_found':
					return response.status(HttpStatus.NOT_FOUND).json({
						success: false,
						error: 'Link not found',
					});

				case 'expired':
					return response.status(HttpStatus.GONE).json({
						success: false,
						error: 'This link has expired',
					});

				case 'inactive':
					return response.status(HttpStatus.GONE).json({
						success: false,
						error: 'This link is no longer active',
					});

				case 'max_clicks':
					return response.status(HttpStatus.GONE).json({
						success: false,
						error: 'This link has reached its maximum clicks',
					});

				case 'password_required':
					return response.status(HttpStatus.OK).json({
						success: false,
						passwordRequired: true,
						linkId: result.linkId,
					});
			}
		}

		// Record click asynchronously (don't wait)
		this.analyticsService
			.recordClick(result.linkId!, {
				userAgent: request.headers['user-agent'] || '',
				referer: request.headers['referer'] || '',
				ip: request.ip,
				utmSource,
				utmMedium,
				utmCampaign,
			})
			.catch((err) => console.error('Failed to record click:', err));

		// Perform redirect
		return response.redirect(302, result.targetUrl!);
	}

	@Post(':code/unlock')
	async unlockLink(
		@Param('code') code: string,
		@Body('password') password: string,
		@Res() response: Response
	) {
		const result = await this.redirectService.verifyPassword(code, password);

		if (!result.success) {
			return response.status(HttpStatus.UNAUTHORIZED).json({
				success: false,
				error: 'Invalid password',
			});
		}

		return response.json({
			success: true,
			targetUrl: result.targetUrl,
		});
	}
}
