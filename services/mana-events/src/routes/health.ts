import { Hono } from 'hono';

export const healthRoutes = new Hono().get('/', (c) =>
	c.json({ status: 'ok', service: 'mana-events', timestamp: new Date().toISOString() })
);
