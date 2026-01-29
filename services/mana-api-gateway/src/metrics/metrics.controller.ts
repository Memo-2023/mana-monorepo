import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@ApiTags('System')
@Controller('metrics')
export class MetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	@Get()
	@ApiOperation({
		summary: 'Prometheus metrics',
		description: 'Returns Prometheus-formatted metrics for monitoring. No authentication required.',
	})
	@ApiProduces('text/plain')
	@ApiResponse({
		status: 200,
		description: 'Prometheus metrics in text format',
	})
	async getMetrics(@Res() res: Response) {
		const metrics = await this.metricsService.getMetrics();
		res.setHeader('Content-Type', this.metricsService.getContentType());
		res.send(metrics);
	}
}
