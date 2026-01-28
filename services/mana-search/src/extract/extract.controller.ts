import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ExtractService } from './extract.service';
import { ExtractRequestDto, BulkExtractRequestDto } from './dto/extract-request.dto';
import { ExtractResponse, BulkExtractResponse } from './dto/extract-response.dto';

@Controller('extract')
export class ExtractController {
	private readonly logger = new Logger(ExtractController.name);

	constructor(private readonly extractService: ExtractService) {}

	/**
	 * Extract content from a URL
	 * POST /api/v1/extract
	 */
	@Post()
	async extract(@Body() request: ExtractRequestDto): Promise<ExtractResponse> {
		this.logger.log(`Extract request: ${request.url}`);
		return this.extractService.extract(request);
	}

	/**
	 * Extract content from multiple URLs
	 * POST /api/v1/extract/bulk
	 */
	@Post('bulk')
	async bulkExtract(@Body() request: BulkExtractRequestDto): Promise<BulkExtractResponse> {
		this.logger.log(`Bulk extract request: ${request.urls.length} URLs`);
		return this.extractService.bulkExtract(request);
	}
}
