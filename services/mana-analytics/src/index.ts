/**
 * mana-analytics — Public-Community Feedback Hub
 *
 * Hono + Bun runtime. Routes:
 *   /api/v1/feedback/*         — auth-required (jwtAuth via JWKS)
 *   /api/v1/public/feedback/*  — read-only, no auth, redacted output
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { serviceErrorHandler as errorHandler } from '@mana/shared-hono';
import { jwtAuth } from './middleware/jwt-auth';
import { FeedbackService } from './services/feedback';
import { healthRoutes } from './routes/health';
import { createFeedbackRoutes } from './routes/feedback';
import { createPublicFeedbackRoutes } from './routes/public';

const config = loadConfig();
const db = getDb(config.databaseUrl);

const feedbackService = new FeedbackService(
	db,
	config.manaLlmUrl,
	config.pseudonymSecret,
	config.manaCreditsUrl,
	config.serviceKey,
	config.founderUserIds
);

const app = new Hono();

app.onError(errorHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

app.route('/health', healthRoutes);

// Public surface: anonymous reads, no JWT required.
app.route('/api/v1/public/feedback', createPublicFeedbackRoutes(feedbackService));

// Authenticated surface: submit, react, manage own items, admin.
app.use('/api/v1/feedback/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/feedback', createFeedbackRoutes(feedbackService));

console.log(`mana-analytics starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
