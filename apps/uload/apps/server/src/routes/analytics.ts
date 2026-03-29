import { Hono } from 'hono';
import type { AnalyticsService } from '../services/analytics';
import type { AuthUser } from '../middleware/jwt-auth';

export function createAnalyticsRoutes(analyticsService: AnalyticsService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/:linkId', async (c) => {
			const linkId = c.req.param('linkId');
			const stats = await analyticsService.getClickStats(linkId);
			return c.json(stats);
		})
		.get('/:linkId/timeline', async (c) => {
			const linkId = c.req.param('linkId');
			const days = parseInt(c.req.query('days') || '30', 10);
			const timeline = await analyticsService.getClicksOverTime(linkId, days);
			return c.json(timeline);
		})
		.get('/:linkId/referrers', async (c) => {
			const linkId = c.req.param('linkId');
			const referrers = await analyticsService.getTopReferrers(linkId);
			return c.json(referrers);
		})
		.get('/:linkId/devices', async (c) => {
			const linkId = c.req.param('linkId');
			const devices = await analyticsService.getDeviceBreakdown(linkId);
			return c.json(devices);
		})
		.get('/:linkId/countries', async (c) => {
			const linkId = c.req.param('linkId');
			const countries = await analyticsService.getCountryBreakdown(linkId);
			return c.json(countries);
		});
}
