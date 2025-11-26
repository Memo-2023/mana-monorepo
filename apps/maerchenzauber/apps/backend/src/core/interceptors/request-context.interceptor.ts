import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { RequestContextService } from '../../common/services/request-context.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request Context Interceptor
 *
 * This interceptor extracts authentication information from the request
 * and stores it in the CLS context, making it available throughout the
 * entire request lifecycle without needing request-scoped providers.
 *
 * It runs before all route handlers and automatically populates the context
 * with token information from headers or request properties.
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly contextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<
      Request & {
        token?: string;
        maerchenzauberToken?: string;
        user?: { id?: string };
      }
    >();

    // Generate a unique request ID for tracing
    const requestId = uuidv4();

    // Extract token from various sources
    let token: string | null = null;
    let maerchenzauberToken: string | null = null;

    // 1. Check if token was already set by middleware or guards
    if (request.token) {
      token = request.token;
    }
    if (request.maerchenzauberToken) {
      maerchenzauberToken = request.maerchenzauberToken;
    }

    // 2. Extract from Authorization header if not already set
    if (!token && !maerchenzauberToken) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const extractedToken = authHeader.substring(7); // Remove 'Bearer ' prefix
        token = extractedToken;
      }
    }

    // 3. Extract user ID if available (from auth guards or middleware)
    let userId: string | undefined;
    if (request.user?.id) {
      userId = request.user.id;
    }

    // Store all context information
    this.contextService.setContext({
      token: token || undefined,
      maerchenzauberToken: maerchenzauberToken || undefined,
      userId,
      requestId,
    });

    // Log context initialization for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Request Context Initialized ===');
      console.log('Request ID:', requestId);
      console.log('URL:', request.url);
      console.log('Method:', request.method);
      console.log('Has token:', !!token);
      console.log('Has maerchenzauberToken:', !!maerchenzauberToken);
      console.log('User ID:', userId);
    }

    return next.handle();
  }
}
