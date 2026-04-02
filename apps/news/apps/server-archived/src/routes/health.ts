import { Hono } from 'hono';

export const healthRoutes = new Hono().get('/', (c) =>
	c.json({
		status: 'ok',
		service: 'news-server',
		runtime: 'bun',
		timestamp: new Date().toISOString(),
	})
);
