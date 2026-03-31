import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { gamesRoutes } from './routes/games';

const PORT = parseInt(process.env.PORT || '3011', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = new Hono();

app.onError((err, c) => {
	console.error('Unhandled error:', err);
	return c.json({ error: 'Internal server error' }, 500);
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.use('*', cors({ origin: CORS_ORIGINS, credentials: false }));

app.get('/health', (c) =>
	c.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'arcade-server' })
);

app.route('/api/games', gamesRoutes);

console.log(`Arcade server running on http://localhost:${PORT}`);

export default { port: PORT, fetch: app.fetch };
