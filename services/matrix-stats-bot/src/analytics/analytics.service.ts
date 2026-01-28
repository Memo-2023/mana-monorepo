import { Injectable, Logger } from '@nestjs/common';
import { UmamiService } from '../umami/umami.service';
import { WEBSITE_IDS, DISPLAY_NAMES } from '../config/configuration';

@Injectable()
export class AnalyticsService {
	private readonly logger = new Logger(AnalyticsService.name);

	constructor(private readonly umamiService: UmamiService) {}

	async generateStatsOverview(): Promise<string> {
		const now = Date.now();
		const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

		const websites = await this.umamiService.getWebsites();
		if (!websites.length) {
			return '❌ Keine Websites in Umami konfiguriert.';
		}

		let report = '**📊 ManaCore Stats (30 Tage)**\n\n';

		for (const website of websites) {
			const stats = await this.umamiService.getStats(website.id, thirtyDaysAgo, now);
			if (!stats) continue;

			const displayName = DISPLAY_NAMES[website.name] || website.name;
			const changeIcon = (change: number) => (change > 0 ? '📈' : change < 0 ? '📉' : '➡️');

			report += `**${displayName}**\n`;
			report += `👁️ ${stats.pageviews.value.toLocaleString()} Views ${changeIcon(stats.pageviews.change)}\n`;
			report += `👥 ${stats.visitors.value.toLocaleString()} Besucher ${changeIcon(stats.visitors.change)}\n\n`;
		}

		return report;
	}

	async generateDailyReport(): Promise<string> {
		const now = Date.now();
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);

		const websites = await this.umamiService.getWebsites();
		if (!websites.length) {
			return '❌ Keine Websites konfiguriert.';
		}

		let report = '**📊 Heute**\n\n';
		let totalViews = 0;
		let totalVisitors = 0;

		for (const website of websites) {
			const stats = await this.umamiService.getStats(website.id, todayStart.getTime(), now);
			if (!stats) continue;

			const displayName = DISPLAY_NAMES[website.name] || website.name;
			totalViews += stats.pageviews.value;
			totalVisitors += stats.visitors.value;

			if (stats.pageviews.value > 0) {
				report += `**${displayName}:** ${stats.pageviews.value} Views, ${stats.visitors.value} Besucher\n`;
			}
		}

		report += `\n**Gesamt:** ${totalViews} Views, ${totalVisitors} Besucher`;

		return report;
	}

	async generateWeeklyReport(): Promise<string> {
		const now = Date.now();
		const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

		const websites = await this.umamiService.getWebsites();
		if (!websites.length) {
			return '❌ Keine Websites konfiguriert.';
		}

		let report = '**📊 Diese Woche**\n\n';
		let totalViews = 0;
		let totalVisitors = 0;

		for (const website of websites) {
			const stats = await this.umamiService.getStats(website.id, weekAgo, now);
			if (!stats) continue;

			const displayName = DISPLAY_NAMES[website.name] || website.name;
			totalViews += stats.pageviews.value;
			totalVisitors += stats.visitors.value;

			const changeIcon = (change: number) => (change > 0 ? '📈' : change < 0 ? '📉' : '➡️');

			report += `**${displayName}**\n`;
			report += `👁️ ${stats.pageviews.value.toLocaleString()} Views ${changeIcon(stats.pageviews.change)} (${stats.pageviews.change > 0 ? '+' : ''}${stats.pageviews.change}%)\n`;
			report += `👥 ${stats.visitors.value.toLocaleString()} Besucher ${changeIcon(stats.visitors.change)}\n\n`;
		}

		report += `**Gesamt:** ${totalViews.toLocaleString()} Views, ${totalVisitors.toLocaleString()} Besucher`;

		return report;
	}

	async generateRealtimeReport(): Promise<string> {
		const websites = await this.umamiService.getWebsites();
		if (!websites.length) {
			return '❌ Keine Websites konfiguriert.';
		}

		let report = '**🔴 Realtime**\n\n';
		let totalActive = 0;

		for (const website of websites) {
			const realtime = await this.umamiService.getRealtime(website.id);
			if (!realtime || realtime.visitors === 0) continue;

			const displayName = DISPLAY_NAMES[website.name] || website.name;
			totalActive += realtime.visitors;

			report += `**${displayName}:** ${realtime.visitors} aktiv\n`;
		}

		if (totalActive === 0) {
			report += 'Keine aktiven Besucher.';
		} else {
			report += `\n**Gesamt:** ${totalActive} aktive Besucher`;
		}

		return report;
	}
}
