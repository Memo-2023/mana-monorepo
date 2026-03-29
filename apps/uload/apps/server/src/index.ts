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

const config = loadConfig();
const db = getDb(config.databaseUrl);

const redirectService = new RedirectService(db);
const analyticsService = new AnalyticsService(db);

const app = new Hono();

app.onError(errorHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

// Health (no auth)
app.route('/health', healthRoutes);

// Redirect (no auth — public)
app.route('/r', createRedirectRoutes(redirectService));

// Analytics API (auth required)
app.use('/api/v1/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/analytics', createAnalyticsRoutes(analyticsService));

console.log(`uload-server starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
