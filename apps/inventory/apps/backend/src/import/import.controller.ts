import {
	Controller,
	Post,
	Get,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ImportService } from './import.service';

@Controller('api/v1/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
	constructor(private readonly importService: ImportService) {}

	@Post('csv')
	@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
	async importCsv(@CurrentUser() user: CurrentUserData, @UploadedFile() file: Express.Multer.File) {
		return this.importService.importCsv(user.userId, file);
	}

	@Get('template')
	async getTemplate(@Res() res: Response) {
		const template = this.importService.getTemplate();

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename=inventory-import-template.csv');
		res.send(template);
	}
}
