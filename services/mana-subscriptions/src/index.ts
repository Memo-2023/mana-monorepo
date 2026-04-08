/**
 * mana-subscriptions — Subscription & billing service
 *
 * Hono + Bun runtime. Extracted from mana-auth.
 * Handles: plans, subscriptions, invoices, Stripe billing.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { serviceErrorHandler as errorHandler } from '@mana/shared-hono';
import { jwtAuth } from './middleware/jwt-auth';
import { serviceAuth } from './middleware/service-auth';
import { StripeService } from './services/stripe';
import { SubscriptionsService } from './services/subscriptions';
import { healthRoutes } from './routes/health';
import { createSubscriptionRoutes } from './routes/subscriptions';
import { createInternalRoutes } from './routes/internal';
import { createWebhookRoutes } from './routes/stripe-webhook';

const config = loadConfig();
const db = getDb(config.databaseUrl);

const stripeService = new StripeService(db, config.stripe.secretKey);
const subscriptionsService = new SubscriptionsService(db, stripeService);

const app = new Hono();

app.onError(errorHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

app.route('/health', healthRoutes);

// User-facing (JWT auth)
app.use('/api/v1/subscriptions/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/subscriptions', createSubscriptionRoutes(subscriptionsService));

// Service-to-service (X-Service-Key)
app.use('/api/v1/internal/*', serviceAuth(config.serviceKey));
app.route('/api/v1/internal', createInternalRoutes(subscriptionsService));

// Stripe webhooks (signature verified, no auth)
app.route(
	'/api/v1/webhooks',
	createWebhookRoutes(stripeService, subscriptionsService, config.stripe.webhookSecret)
);

console.log(`mana-subscriptions starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
