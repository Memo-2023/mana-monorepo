import {
	Injectable,
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Inject,
} from '@nestjs/common';
import Redis from 'ioredis';
import { ApiKeyData } from '../api-keys/api-keys.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RateLimitGuard implements CanActivate {
	constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const apiKey = request.apiKey as ApiKeyData;

		if (!apiKey) {
			return true; // Let ApiKeyGuard handle missing key
		}

		const key = `ratelimit:${apiKey.id}`;
		const limit = apiKey.rateLimit;
		const window = 60; // 60 seconds

		// Sliding window rate limiting using sorted set
		const now = Date.now();
		const windowStart = now - window * 1000;

		// Remove old entries
		await this.redis.zremrangebyscore(key, 0, windowStart);

		// Count current requests
		const count = await this.redis.zcard(key);

		if (count >= limit) {
			// Get the oldest entry to calculate retry-after
			const oldestEntries = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
			const oldestTimestamp = oldestEntries.length > 1 ? parseInt(oldestEntries[1], 10) : now;
			const retryAfter = Math.ceil((oldestTimestamp + window * 1000 - now) / 1000);

			throw new HttpException(
				{
					statusCode: HttpStatus.TOO_MANY_REQUESTS,
					message: 'Rate limit exceeded',
					retryAfter,
					limit,
					remaining: 0,
				},
				HttpStatus.TOO_MANY_REQUESTS
			);
		}

		// Add current request
		await this.redis.zadd(key, now, `${now}`);
		await this.redis.expire(key, window);

		// Add rate limit headers to response
		const response = context.switchToHttp().getResponse();
		response.setHeader('X-RateLimit-Limit', limit);
		response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count - 1));
		response.setHeader('X-RateLimit-Reset', Math.ceil(now / 1000) + window);

		return true;
	}
}
