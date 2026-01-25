import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
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
			tap(() => {
				this.recordMetrics(method, route, response.statusCode, startTime);
			}),
			catchError((error) => {
				// Extract status code from HttpException or use 500
				const status =
					error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
				this.recordMetrics(method, route, status, startTime);
				return throwError(() => error);
			})
		);
	}

	private recordMetrics(method: string, route: string, status: number, startTime: number): void {
		const duration = (Date.now() - startTime) / 1000;
		const statusStr = status.toString();

		this.metricsService.httpRequestsTotal.inc({
			method,
			route,
			status: statusStr,
		});

		this.metricsService.httpRequestDuration.observe({ method, route, status: statusStr }, duration);
	}

	private normalizeRoute(path: string): string {
		// Replace UUIDs and numeric IDs with placeholders
		return path
			.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
			.replace(/\/\d+/g, '/:id');
	}
}
