import { Controller, Get, Post, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
	constructor(private readonly analyticsService: AnalyticsService) {}

	/**
	 * Health check endpoint
	 */
	@Get('health')
	async getHealth() {
		return this.analyticsService.getHealth();
	}

	/**
	 * Get latest metrics snapshot
	 */
	@Get('latest')
	async getLatest() {
		const metrics = await this.analyticsService.getLatestMetrics();
		if (!metrics) {
			return { message: 'No metrics recorded yet' };
		}
		return metrics;
	}

	/**
	 * Get user growth data
	 * @param days Number of days to look back (default: 90)
	 */
	@Get('growth')
	async getGrowth(@Query('days') days?: string) {
		const numDays = days ? parseInt(days, 10) : 90;
		return this.analyticsService.getUserGrowth(numDays);
	}

	/**
	 * Get monthly aggregated metrics
	 * @param months Number of months to look back (default: 12)
	 */
	@Get('monthly')
	async getMonthly(@Query('months') months?: string) {
		const numMonths = months ? parseInt(months, 10) : 12;
		return this.analyticsService.getMonthlyMetrics(numMonths);
	}

	/**
	 * Get metrics for a date range
	 * @param start Start date (YYYY-MM-DD)
	 * @param end End date (YYYY-MM-DD)
	 */
	@Get('range')
	async getRange(@Query('start') start: string, @Query('end') end: string) {
		if (!start || !end) {
			return { error: 'Both start and end dates are required (YYYY-MM-DD format)' };
		}
		return this.analyticsService.getMetricsRange(start, end);
	}

	/**
	 * Trigger manual snapshot (for testing/recovery)
	 */
	@Post('snapshot')
	async triggerSnapshot() {
		await this.analyticsService.recordDailySnapshot();
		return { message: 'Snapshot recorded successfully' };
	}

	/**
	 * Grafana JSON API compatible endpoint - query
	 * Used by Grafana Infinity datasource
	 */
	@Post('grafana/query')
	async grafanaQuery(@Res() res: Response) {
		// Return available targets
		const latest = await this.analyticsService.getLatestMetrics();
		const growth = await this.analyticsService.getUserGrowth(30);

		res.status(HttpStatus.OK).json([
			{
				target: 'total_users',
				datapoints: growth.map((g) => [g.total_users, new Date(g.date).getTime()]),
			},
			{
				target: 'daily_growth',
				datapoints: growth.map((g) => [g.growth ?? 0, new Date(g.date).getTime()]),
			},
		]);
	}

	/**
	 * Grafana JSON API compatible endpoint - search
	 * Returns available metrics
	 */
	@Post('grafana/search')
	async grafanaSearch() {
		return [
			'total_users',
			'verified_users',
			'new_users_today',
			'new_users_week',
			'new_users_month',
			'daily_growth',
		];
	}

	/**
	 * Summary endpoint for dashboards
	 */
	@Get('summary')
	async getSummary() {
		const latest = await this.analyticsService.getLatestMetrics();
		const monthly = await this.analyticsService.getMonthlyMetrics(2);
		const health = await this.analyticsService.getHealth();

		const currentMonth = monthly[monthly.length - 1];
		const previousMonth = monthly[monthly.length - 2];

		return {
			current: latest,
			trends: {
				month_over_month_growth:
					currentMonth && previousMonth
						? ((currentMonth.total_users_eom - previousMonth.total_users_eom) /
								previousMonth.total_users_eom) *
							100
						: null,
				new_users_this_month: currentMonth?.new_users ?? 0,
			},
			health,
		};
	}
}
