import {
	Controller,
	Post,
	Get,
	Delete,
	Body,
	Param,
	Query,
	ParseUUIDPipe,
	ParseIntPipe,
	DefaultValuePipe,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { StartCrawlDto } from './dto/start-crawl.dto';
import { CrawlJobResponse, CrawlResultResponse, PaginatedResults } from './dto/crawl-response.dto';

@Controller('crawl')
export class CrawlerController {
	constructor(private readonly crawlerService: CrawlerService) {}

	@Post()
	async startCrawl(@Body() dto: StartCrawlDto): Promise<CrawlJobResponse> {
		return this.crawlerService.startCrawl(dto);
	}

	@Get()
	async listJobs(
		@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
		@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
		@Query('status') status?: string,
	): Promise<PaginatedResults<CrawlJobResponse>> {
		return this.crawlerService.listJobs(page, limit, status);
	}

	@Get(':jobId')
	async getJob(
		@Param('jobId', ParseUUIDPipe) jobId: string,
	): Promise<CrawlJobResponse> {
		return this.crawlerService.getJob(jobId);
	}

	@Get(':jobId/results')
	async getJobResults(
		@Param('jobId', ParseUUIDPipe) jobId: string,
		@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
		@Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
	): Promise<PaginatedResults<CrawlResultResponse>> {
		return this.crawlerService.getJobResults(jobId, page, limit);
	}

	@Delete(':jobId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async cancelJob(
		@Param('jobId', ParseUUIDPipe) jobId: string,
	): Promise<CrawlJobResponse> {
		return this.crawlerService.cancelJob(jobId);
	}

	@Post(':jobId/pause')
	async pauseJob(
		@Param('jobId', ParseUUIDPipe) jobId: string,
	): Promise<CrawlJobResponse> {
		return this.crawlerService.pauseJob(jobId);
	}

	@Post(':jobId/resume')
	async resumeJob(
		@Param('jobId', ParseUUIDPipe) jobId: string,
	): Promise<CrawlJobResponse> {
		return this.crawlerService.resumeJob(jobId);
	}
}
