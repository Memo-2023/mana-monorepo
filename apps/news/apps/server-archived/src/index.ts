import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
import { ExtractService } from './services/extract';
import { FeedService } from './services/feed';
import { healthRoutes } from './routes/health';
import { createExtractRoutes } from './routes/extract';
import { createFeedRoutes } from './routes/feed';

const config = loadConfig();
const db = getDb(config.databaseUrl);

const extractService = new ExtractService();
const feedService = new FeedService(db);

const app = new Hono();

app.onError(errorHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

// Public routes (no auth)
app.route('/health', healthRoutes);
app.route('/api/v1/feed', createFeedRoutes(feedService));

// Preview extraction (public)
app.post('/api/v1/extract/preview', async (c) => {
	const { url } = await c.req.json<{ url: string }>();
	if (!url) return c.json({ error: 'URL is required' }, 400);
	const article = await extractService.extractFromUrl(url);
	return c.json(article);
});

// Protected routes (auth required)
app.use('/api/v1/extract/save', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/extract', createExtractRoutes(extractService));

// eslint-disable-next-line no-console
console.log(`news-server starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
