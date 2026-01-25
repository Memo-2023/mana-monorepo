import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	constructor(private readonly metricsService: MetricsService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const httpContext = context.switchToHttp();
		const request = httpContext.getRequest<Request>();
		const response = httpContext.getResponse<Response>();

		// Skip metrics endpoint itself
		if (request.path === '/metrics') {
			return next.handle();
		}

		const startTime = Date.now();
		const method = request.method;
		// Normalize route (remove IDs to prevent high cardinality)
		const route = this.normalizeRoute(request.path);

		return next.handle().pipe(
			tap({
				next: () => {
					this.recordMetrics(method, route, response.statusCode, startTime);
				},
				error: () => {
					const status = response.statusCode >= 400 ? response.statusCode : 500;
					this.recordMetrics(method, route, status, startTime);
				},
			})
		);
	}

	private recordMetrics(
		method: string,
		route: string,
		status: number,
		startTime: number
	): void {
		const duration = (Date.now() - startTime) / 1000;
		const statusStr = status.toString();

		this.metricsService.httpRequestsTotal.inc({
			method,
			route,
			status: statusStr,
		});

		this.metricsService.httpRequestDuration.observe(
			{ method, route, status: statusStr },
			duration
		);
	}

	private normalizeRoute(path: string): string {
		// Replace UUIDs and numeric IDs with placeholders
		return path
			.replace(
				/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
				':id'
			)
			.replace(/\/\d+/g, '/:id');
	}
}
