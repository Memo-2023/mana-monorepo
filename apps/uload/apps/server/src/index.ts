import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
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
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

// Health (no auth)
app.route('/health', healthRoutes);

// Public routes (no auth)
app.route('/r', createRedirectRoutes(redirectService));
app.route('/public', createPublicRoutes(db));

// Analytics API (auth required)
app.use('/api/v1/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/analytics', createAnalyticsRoutes(analyticsService));
app.route('/api/v1/stripe', createStripeRoutes());
app.route('/api/v1/email', createEmailRoutes());

console.log(`uload-server starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
