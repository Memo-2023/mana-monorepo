import { Hono } from 'hono';

export const healthRoutes = new Hono().get('/', (c) =>
	c.json({
		status: 'ok',
		service: 'mana-research',
		version: '0.1.0',
		timestamp: new Date().toISOString(),
	})
);
