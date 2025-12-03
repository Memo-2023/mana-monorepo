import {
	Controller,
	Post,
	Get,
	Body,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
	Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ImportService } from './import.service';
import { ExecuteImportDto } from './dto/import.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = ['.vcf', '.vcard', '.csv'];

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
	constructor(private readonly importService: ImportService) {}

	/**
	 * Preview import from uploaded file
	 */
	@Post('preview')
	@UseInterceptors(
		FileInterceptor('file', {
			limits: { fileSize: MAX_FILE_SIZE },
			fileFilter: (req, file, callback) => {
				const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
				if (!ALLOWED_EXTENSIONS.includes(ext)) {
					callback(
						new BadRequestException(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`),
						false
					);
					return;
				}
				callback(null, true);
			},
		})
	)
	async previewImport(
		@CurrentUser() user: CurrentUserData,
		@UploadedFile() file: Express.Multer.File
	) {
		if (!file) {
			throw new BadRequestException('No file uploaded');
		}

		return this.importService.preview(user.userId, file);
	}

	/**
	 * Execute the import with selected options
	 */
	@Post('execute')
	async executeImport(@CurrentUser() user: CurrentUserData, @Body() dto: ExecuteImportDto) {
		return this.importService.execute(user.userId, dto);
	}

	/**
	 * Download CSV template
	 */
	@Get('template/csv')
	async getCsvTemplate(@Res() res: Response) {
		const template = this.importService.getCsvTemplate();

		res.set({
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="contacts-template.csv"',
		});

		res.send(template);
	}
}
