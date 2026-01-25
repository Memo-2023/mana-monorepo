import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	@Get('metrics')
	async getMetrics(@Res() res: Response): Promise<void> {
		res.set('Content-Type', this.metricsService.getContentType());
		res.send(await this.metricsService.getMetrics());
	}
}
