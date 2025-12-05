import { Controller, Get, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ExportService } from './export.service';

class ExportOptionsDto {
	categoryId?: string;
	locationId?: string;
	includeArchived?: boolean;
}

@Controller('api/v1/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
	constructor(private readonly exportService: ExportService) {}

	@Get('csv')
	async exportCsv(
		@CurrentUser() user: CurrentUserData,
		@Query() options: ExportOptionsDto,
		@Res() res: Response
	) {
		const csv = await this.exportService.exportCsv(user.userId, options);

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader(
			'Content-Disposition',
			`attachment; filename=inventory-export-${new Date().toISOString().split('T')[0]}.csv`
		);
		res.send(csv);
	}

	@Post('csv')
	async exportCsvWithOptions(
		@CurrentUser() user: CurrentUserData,
		@Body() options: ExportOptionsDto,
		@Res() res: Response
	) {
		const csv = await this.exportService.exportCsv(user.userId, options);

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader(
			'Content-Disposition',
			`attachment; filename=inventory-export-${new Date().toISOString().split('T')[0]}.csv`
		);
		res.send(csv);
	}
}
