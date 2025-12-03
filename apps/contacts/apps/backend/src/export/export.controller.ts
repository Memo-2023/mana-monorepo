import { Controller, Get, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ExportService } from './export.service';
import { ExportRequestDto, ExportFormat } from './dto/export.dto';

@Controller('api/v1/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
	constructor(private readonly exportService: ExportService) {}

	/**
	 * Export contacts via POST with options in body
	 */
	@Post()
	async exportContacts(
		@CurrentUser() user: CurrentUserData,
		@Body() exportRequest: ExportRequestDto,
		@Res() res: Response
	) {
		const result = await this.exportService.exportContacts(user.userId, exportRequest);

		res.setHeader('Content-Type', result.mimeType);
		res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
		res.setHeader('X-Contact-Count', result.contactCount.toString());
		res.send(result.data);
	}

	/**
	 * Quick export all contacts via GET
	 */
	@Get()
	async quickExport(
		@CurrentUser() user: CurrentUserData,
		@Res() res: Response,
		@Query('format') format: ExportFormat = 'vcard',
		@Query('favorites') favorites?: string,
		@Query('archived') archived?: string
	) {
		const exportRequest: ExportRequestDto = {
			format,
			includeFavorites: favorites === 'true' ? true : favorites === 'false' ? false : undefined,
			includeArchived: archived === 'true',
		};

		const result = await this.exportService.exportContacts(user.userId, exportRequest);

		res.setHeader('Content-Type', result.mimeType);
		res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
		res.setHeader('X-Contact-Count', result.contactCount.toString());
		res.send(result.data);
	}
}
