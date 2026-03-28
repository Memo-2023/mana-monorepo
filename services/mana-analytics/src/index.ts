/**
 * mana-analytics — Feedback and analytics service
 *
 * Hono + Bun runtime. Extracted from mana-core-auth.
 * Handles: user feedback, voting, AI-powered title generation.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
import { FeedbackService } from './services/feedback';
import { healthRoutes } from './routes/health';
import { createFeedbackRoutes } from './routes/feedback';

const config = loadConfig();
const db = getDb(config.databaseUrl);

const feedbackService = new FeedbackService(db, config.manaLlmUrl);

const app = new Hono();

app.onError(errorHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

app.route('/health', healthRoutes);

app.use('/api/v1/feedback/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/feedback', createFeedbackRoutes(feedbackService));

console.log(`mana-analytics starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
