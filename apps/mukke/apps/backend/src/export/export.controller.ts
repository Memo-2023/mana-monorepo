import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ExportService } from './export.service';
import type { ExportFormat } from '@mukke/shared';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
	constructor(private readonly exportService: ExportService) {}

	@Get(':projectId')
	async exportProject(
		@CurrentUser() user: CurrentUserData,
		@Param('projectId', ParseUUIDPipe) projectId: string,
		@Query('format') format: ExportFormat = 'json',
		@Res() res: Response
	) {
		const result = await this.exportService.exportProject(projectId, user.userId, format);

		res.setHeader('Content-Type', result.contentType);
		res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
		res.send(result.content);
	}
}
