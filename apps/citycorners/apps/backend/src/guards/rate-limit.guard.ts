import {
	Injectable,
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
} from '@nestjs/common';

interface RequestRecord {
	count: number;
	resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
	private readonly requests = new Map<string, RequestRecord>();
	private readonly maxRequests = 10;
	private readonly windowMs = 60_000; // 1 minute
	private cleanupInterval: ReturnType<typeof setInterval>;

	constructor() {
		// Clean up old entries every 5 minutes
		this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60_000);
		this.cleanupInterval.unref();
	}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const ip =
			request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
			request.ip ||
			request.connection?.remoteAddress ||
			'unknown';

		const now = Date.now();
		const record = this.requests.get(ip);

		if (!record || now > record.resetAt) {
			this.requests.set(ip, { count: 1, resetAt: now + this.windowMs });
			return true;
		}

		record.count++;

		if (record.count > this.maxRequests) {
			const retryAfter = Math.ceil((record.resetAt - now) / 1000);
			throw new HttpException(
				{
					statusCode: HttpStatus.TOO_MANY_REQUESTS,
					message: 'Too many requests. Please try again later.',
					retryAfter,
				},
				HttpStatus.TOO_MANY_REQUESTS
			);
		}

		return true;
	}

	private cleanup() {
		const now = Date.now();
		for (const [ip, record] of this.requests) {
			if (now > record.resetAt) {
				this.requests.delete(ip);
			}
		}
	}
}
