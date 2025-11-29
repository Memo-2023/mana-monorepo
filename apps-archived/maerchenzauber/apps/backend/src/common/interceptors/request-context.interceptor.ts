import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../services/request-context.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
	constructor(private readonly requestContextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();

		// Initialize request context
		const requestId = request.headers['x-request-id'] || uuidv4();
		this.requestContextService.setContext({ requestId });

		// Extract and store JWT token if present
		const authHeader = request.headers.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.substring(7);
			this.requestContextService.setToken(token);
		}

		// Store token from request object if set by guard/middleware
		if (request.token) {
			this.requestContextService.setToken(request.token);
		}

		// Store user ID if available
		if (request.user?.sub) {
			this.requestContextService.setUserId(request.user.sub);
		}

		// Add request ID to response headers
		const response = context.switchToHttp().getResponse();
		response.setHeader('X-Request-ID', requestId);

		return next.handle();
	}
}
