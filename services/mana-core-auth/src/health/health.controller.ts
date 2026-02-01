/**
 * Health Check Controller
 *
 * Provides health check endpoints for Kubernetes/Docker:
 * - /health - Basic health check (always returns ok if server is running)
 * - /health/live - Liveness probe (is the process running?)
 * - /health/ready - Readiness probe (is the service ready to accept traffic?)
 *
 * Readiness checks database connectivity to ensure the service
 * can actually handle requests before receiving traffic.
 */

import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/connection';

interface HealthStatus {
	status: 'ok' | 'error';
	timestamp: string;
	uptime: number;
	checks?: {
		database?: { status: 'ok' | 'error'; latency?: number; error?: string };
		redis?: { status: 'ok' | 'error' | 'not_configured'; latency?: number; error?: string };
	};
}

@ApiTags('health')
@Controller('health')
export class HealthController {
	private readonly startTime = Date.now();

	constructor(private configService: ConfigService) {}

	/**
	 * Basic health check
	 * Returns ok if the server is running
	 */
	@Get()
	@ApiOperation({ summary: 'Basic health check', description: 'Returns ok if server is running' })
	@ApiResponse({ status: 200, description: 'Service is healthy' })
	check(): HealthStatus {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: Math.floor((Date.now() - this.startTime) / 1000),
		};
	}

	/**
	 * Liveness probe
	 * Used by Kubernetes to determine if the process should be restarted
	 * Only checks if the process is alive, not if dependencies are healthy
	 */
	@Get('live')
	@ApiOperation({
		summary: 'Liveness probe',
		description: 'Kubernetes liveness check - returns ok if process is alive',
	})
	@ApiResponse({ status: 200, description: 'Process is alive' })
	live(): { status: 'ok' } {
		return { status: 'ok' };
	}

	/**
	 * Readiness probe
	 * Used by Kubernetes to determine if the service should receive traffic
	 * Checks database connectivity before marking as ready
	 */
	@Get('ready')
	@ApiOperation({
		summary: 'Readiness probe',
		description: 'Kubernetes readiness check - verifies database and Redis connectivity',
	})
	@ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
	@ApiResponse({ status: 503, description: 'Service is not ready (database or Redis unreachable)' })
	async ready(): Promise<HealthStatus> {
		const checks: HealthStatus['checks'] = {};
		let allHealthy = true;

		// Check database
		const dbCheck = await this.checkDatabase();
		checks.database = dbCheck;
		if (dbCheck.status === 'error') {
			allHealthy = false;
		}

		// Check Redis (optional - don't fail if not configured)
		const redisCheck = await this.checkRedis();
		checks.redis = redisCheck;
		// Don't fail readiness if Redis is just not configured
		if (redisCheck.status === 'error') {
			allHealthy = false;
		}

		const status: HealthStatus = {
			status: allHealthy ? 'ok' : 'error',
			timestamp: new Date().toISOString(),
			uptime: Math.floor((Date.now() - this.startTime) / 1000),
			checks,
		};

		if (!allHealthy) {
			throw new ServiceUnavailableException(status);
		}

		return status;
	}

	/**
	 * Check database connectivity
	 */
	private async checkDatabase(): Promise<{
		status: 'ok' | 'error';
		latency?: number;
		error?: string;
	}> {
		const start = Date.now();

		try {
			const databaseUrl = this.configService.get<string>('database.url');
			if (!databaseUrl) {
				return { status: 'error', error: 'DATABASE_URL not configured' };
			}

			const db = getDb(databaseUrl);
			await db.execute(sql`SELECT 1`);

			return {
				status: 'ok',
				latency: Date.now() - start,
			};
		} catch (error) {
			return {
				status: 'error',
				latency: Date.now() - start,
				error: error instanceof Error ? error.message : 'Unknown database error',
			};
		}
	}

	/**
	 * Check Redis connectivity (optional)
	 */
	private async checkRedis(): Promise<{
		status: 'ok' | 'error' | 'not_configured';
		latency?: number;
		error?: string;
	}> {
		const redisHost = this.configService.get<string>('redis.host');

		// Redis is optional - if not configured, that's fine
		if (!redisHost) {
			return { status: 'not_configured' };
		}

		const start = Date.now();

		try {
			// Simple TCP connection check to Redis
			const net = await import('net');
			const redisPort = this.configService.get<number>('redis.port') || 6379;

			await new Promise<void>((resolve, reject) => {
				const socket = new net.Socket();
				const timeout = setTimeout(() => {
					socket.destroy();
					reject(new Error('Connection timeout'));
				}, 2000);

				socket.connect(redisPort, redisHost, () => {
					clearTimeout(timeout);
					socket.destroy();
					resolve();
				});

				socket.on('error', (err) => {
					clearTimeout(timeout);
					reject(err);
				});
			});

			return {
				status: 'ok',
				latency: Date.now() - start,
			};
		} catch (error) {
			return {
				status: 'error',
				latency: Date.now() - start,
				error: error instanceof Error ? error.message : 'Unknown Redis error',
			};
		}
	}
}
