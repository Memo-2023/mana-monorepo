import { json } from '@sveltejs/kit';
import { building } from '$app/environment';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	const checks: Record<string, { status: string; message?: string }> = {};

	// Database health check
	try {
		const result = await locals.db.execute(sql`SELECT 1 as health`);
		checks.database = {
			status: result ? 'healthy' : 'unhealthy',
			message: 'PostgreSQL connection successful',
		};
	} catch (error) {
		checks.database = {
			status: 'unhealthy',
			message: error instanceof Error ? error.message : 'Database connection failed',
		};
	}

	// Overall health status
	const isHealthy = Object.values(checks).every((check) => check.status === 'healthy');

	const health = {
		status: isHealthy ? 'healthy' : 'unhealthy',
		timestamp: new Date().toISOString(),
		environment: building ? 'build' : 'runtime',
		services: {
			sveltekit: 'running',
			...checks,
		},
	};

	return json(health, {
		status: isHealthy ? 200 : 503,
	});
};
