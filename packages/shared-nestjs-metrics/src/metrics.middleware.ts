import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
	constructor(private readonly metricsService: MetricsService) {}

	use(req: Request, res: Response, next: NextFunction): void {
		// Skip metrics endpoint itself to avoid recursion
		if (req.path === '/metrics') {
			return next();
		}

		const startTime = Date.now();
		const method = req.method;

		// Track in-flight requests
		this.metricsService.incrementInFlight(method);

		// Hook into response finish
		res.on('finish', () => {
			const duration = Date.now() - startTime;
			const status = res.statusCode;
			const path = req.route?.path || req.path;

			// Record metrics
			this.metricsService.incrementHttpRequests(method, path, status);
			this.metricsService.observeHttpDuration(method, path, status, duration);
			this.metricsService.decrementInFlight(method);
		});

		next();
	}
}
