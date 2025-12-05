import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
	constructor(private readonly reportService: ReportService) {}

	@Get('dashboard')
	getDashboard(@CurrentUser() user: CurrentUserData) {
		return this.reportService.getDashboard(user.userId);
	}

	@Get('monthly-summary')
	getMonthlySummary(
		@CurrentUser() user: CurrentUserData,
		@Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
		@Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe) month: number
	) {
		return this.reportService.getMonthlySummary(user.userId, year, month);
	}

	@Get('category-breakdown')
	getCategoryBreakdown(
		@CurrentUser() user: CurrentUserData,
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string,
		@Query('type') type?: 'income' | 'expense'
	) {
		return this.reportService.getCategoryBreakdown(user.userId, startDate, endDate, type);
	}

	@Get('trends')
	getTrends(
		@CurrentUser() user: CurrentUserData,
		@Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number
	) {
		return this.reportService.getTrends(user.userId, months);
	}

	@Get('cash-flow')
	getCashFlow(
		@CurrentUser() user: CurrentUserData,
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string
	) {
		return this.reportService.getCashFlow(user.userId, startDate, endDate);
	}
}
