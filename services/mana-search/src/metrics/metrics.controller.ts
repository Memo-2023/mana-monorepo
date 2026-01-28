import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	@Get('/metrics')
	async metrics(@Res() res: Response) {
		const contentType = await this.metricsService.getContentType();
		const metrics = await this.metricsService.getMetrics();

		res.setHeader('Content-Type', contentType);
		res.send(metrics);
	}
}
