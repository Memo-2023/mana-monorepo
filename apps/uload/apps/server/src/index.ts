import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, errorHandler, notFoundHandler } from '@manacore/shared-hono';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { RedirectService } from './services/redirect';
import { AnalyticsService } from './services/analytics';
import { healthRoutes } from './routes/health';
import { createRedirectRoutes } from './routes/redirect';
import { createAnalyticsRoutes } from './routes/analytics';
import { createStripeRoutes } from './routes/stripe';
import { createEmailRoutes } from './routes/email';
import { createPublicRoutes } from './routes/public';

const config = loadConfig();
const db = getDb(config.databaseUrl);

const redirectService = new RedirectService(db);
const analyticsService = new AnalyticsService(db);

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

// Health (no auth)
app.route('/health', healthRoutes);

// Public routes (no auth)
app.route('/r', createRedirectRoutes(redirectService));
app.route('/public', createPublicRoutes(db));

// Stripe webhook (no auth — signature verified internally)
app.post('/api/v1/stripe/webhook', async (c) => {
	const routes = createStripeRoutes(config);
	return routes.fetch(c.req.raw);
});

// Authenticated API routes
app.use('/api/v1/*', authMiddleware());
app.route('/api/v1/analytics', createAnalyticsRoutes(analyticsService));
app.route('/api/v1/stripe', createStripeRoutes(config));
app.route('/api/v1/email', createEmailRoutes());

console.log(`uload-server starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
