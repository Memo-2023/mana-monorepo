/**
 * mana-credits — Standalone credit management service
 *
 * Hono + Bun runtime. Extracted from mana-auth.
 * Handles: personal credits, guild pools, gift codes, Stripe payments.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
import { serviceAuth } from './middleware/service-auth';
import { StripeService } from './services/stripe';
import { GuildPoolService } from './services/guild-pool';
import { CreditsService } from './services/credits';
import { GiftCodeService } from './services/gift-code';
import { healthRoutes } from './routes/health';
import { createCreditsRoutes } from './routes/credits';
import { createGuildRoutes } from './routes/guild';
import { createGiftRoutes } from './routes/gifts';
import { createInternalRoutes } from './routes/internal';
import { createWebhookRoutes } from './routes/stripe-webhook';

// ─── Bootstrap ──────────────────────────────────────────────

const config = loadConfig();
const db = getDb(config.databaseUrl);

// Instantiate services (manual DI — no NestJS)
const stripeService = new StripeService(db, config.stripe.secretKey);
const guildPoolService = new GuildPoolService(db, config.manaAuthUrl, config.serviceKey);
const creditsService = new CreditsService(db, stripeService, guildPoolService);
const giftCodeService = new GiftCodeService(db, config.baseUrl);

// ─── App ────────────────────────────────────────────────────

const app = new Hono();

// Global middleware
app.onError(errorHandler);
app.use(
	'*',
	cors({
		origin: config.cors.origins,
		credentials: true,
	})
);

// Health check (no auth)
app.route('/health', healthRoutes);

// User-facing routes (JWT auth)
app.use('/api/v1/credits/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/credits', createCreditsRoutes(creditsService));
app.route('/api/v1/credits/guild', createGuildRoutes(guildPoolService));

// Gift routes (mixed: public GET /:code, JWT for rest)
app.route('/api/v1/gifts', createGiftRoutes(giftCodeService, config.manaAuthUrl));

// Service-to-service routes (X-Service-Key auth)
app.use('/api/v1/internal/*', serviceAuth(config.serviceKey));
app.route(
	'/api/v1/internal',
	createInternalRoutes(creditsService, giftCodeService, guildPoolService)
);

// Stripe webhooks (verified by signature, no auth middleware)
app.route(
	'/api/v1/webhooks',
	createWebhookRoutes(stripeService, creditsService, config.stripe.webhookSecret)
);

// ─── Start ──────────────────────────────────────────────────

console.log(`mana-credits starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
