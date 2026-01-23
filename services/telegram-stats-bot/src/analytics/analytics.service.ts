import { Injectable, Logger } from '@nestjs/common';
import { UmamiService, UmamiStats } from '../umami/umami.service';
import {
	formatDailyReport,
	formatWeeklyReport,
	formatRealtimeReport,
	formatStatsOverview,
} from './formatters';

@Injectable()
export class AnalyticsService {
	private readonly logger = new Logger(AnalyticsService.name);

	constructor(private readonly umamiService: UmamiService) {}

	private getStartOfDay(date: Date = new Date()): Date {
		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		return start;
	}

	private getEndOfDay(date: Date = new Date()): Date {
		const end = new Date(date);
		end.setHours(23, 59, 59, 999);
		return end;
	}

	private getStartOfWeek(date: Date = new Date()): Date {
		const start = new Date(date);
		const day = start.getDay();
		const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
		start.setDate(diff);
		start.setHours(0, 0, 0, 0);
		return start;
	}

	private getEndOfWeek(date: Date = new Date()): Date {
		const end = this.getStartOfWeek(date);
		end.setDate(end.getDate() + 6);
		end.setHours(23, 59, 59, 999);
		return end;
	}

	async getTodayStats(): Promise<Map<string, UmamiStats>> {
		const startAt = this.getStartOfDay().getTime();
		const endAt = this.getEndOfDay().getTime();
		return this.umamiService.getAllWebsiteStats(startAt, endAt);
	}

	async getYesterdayStats(): Promise<Map<string, UmamiStats>> {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const startAt = this.getStartOfDay(yesterday).getTime();
		const endAt = this.getEndOfDay(yesterday).getTime();
		return this.umamiService.getAllWebsiteStats(startAt, endAt);
	}

	async getWeekStats(): Promise<Map<string, UmamiStats>> {
		const startAt = this.getStartOfWeek().getTime();
		const endAt = this.getEndOfWeek().getTime();
		return this.umamiService.getAllWebsiteStats(startAt, endAt);
	}

	async getPreviousWeekStats(): Promise<Map<string, UmamiStats>> {
		const prevWeekStart = this.getStartOfWeek();
		prevWeekStart.setDate(prevWeekStart.getDate() - 7);
		const prevWeekEnd = this.getEndOfWeek(prevWeekStart);
		return this.umamiService.getAllWebsiteStats(prevWeekStart.getTime(), prevWeekEnd.getTime());
	}

	async getRealtimeStats(): Promise<Map<string, number>> {
		return this.umamiService.getAllActiveVisitors();
	}

	async generateDailyReport(): Promise<string> {
		try {
			const stats = await this.getTodayStats();
			return formatDailyReport(stats, new Date());
		} catch (error) {
			this.logger.error('Failed to generate daily report:', error);
			return '❌ Fehler beim Erstellen des Daily Reports';
		}
	}

	async generateWeeklyReport(): Promise<string> {
		try {
			const stats = await this.getWeekStats();
			const prevStats = await this.getPreviousWeekStats();
			const weekStart = this.getStartOfWeek();
			const weekEnd = this.getEndOfWeek();
			return formatWeeklyReport(stats, weekStart, weekEnd, prevStats);
		} catch (error) {
			this.logger.error('Failed to generate weekly report:', error);
			return '❌ Fehler beim Erstellen des Weekly Reports';
		}
	}

	async generateRealtimeReport(): Promise<string> {
		try {
			const activeVisitors = await this.getRealtimeStats();
			return formatRealtimeReport(activeVisitors);
		} catch (error) {
			this.logger.error('Failed to generate realtime report:', error);
			return '❌ Fehler beim Abrufen der Realtime-Daten';
		}
	}

	async generateStatsOverview(): Promise<string> {
		try {
			// Get last 30 days stats for overview
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			const startAt = this.getStartOfDay(thirtyDaysAgo).getTime();
			const endAt = this.getEndOfDay().getTime();
			const stats = await this.umamiService.getAllWebsiteStats(startAt, endAt);
			return formatStatsOverview(stats);
		} catch (error) {
			this.logger.error('Failed to generate stats overview:', error);
			return '❌ Fehler beim Abrufen der Statistiken';
		}
	}
}
