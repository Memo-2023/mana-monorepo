/**
 * mana-mail — Mail service for the Mana ecosystem.
 *
 * Hono + Bun runtime. Provides JMAP-based email access to Stalwart,
 * account provisioning (@mana.how addresses), and mail API for the frontend.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { serviceErrorHandler as errorHandler } from '@mana/shared-hono';
import { jwtAuth } from './middleware/jwt-auth';
import { serviceAuth } from './middleware/service-auth';
import { JmapClient } from './services/jmap-client';
import { AccountService } from './services/account-service';
import { MailService } from './services/mail-service';
import { healthRoutes } from './routes/health';
import { createThreadRoutes } from './routes/threads';
import { createMessageRoutes } from './routes/messages';
import { createSendRoutes } from './routes/send';
import { createLabelRoutes } from './routes/labels';
import { createAccountRoutes } from './routes/accounts';
import { createInternalRoutes } from './routes/internal';

// ─── Bootstrap ──────────────────────────────────────────────

const config = loadConfig();
const db = getDb(config.databaseUrl);

// Instantiate services
const jmapClient = new JmapClient(config.stalwart);
const accountService = new AccountService(db, config.stalwart);
const mailService = new MailService(db, jmapClient, accountService);

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
app.use('/api/v1/mail/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/mail', createThreadRoutes(mailService));
app.route('/api/v1/mail', createSendRoutes(mailService));
app.route('/api/v1/mail', createLabelRoutes(mailService));
app.route('/api/v1/mail', createAccountRoutes(accountService));
app.route('/api/v1/mail/messages', createMessageRoutes(mailService));

// Service-to-service routes (X-Service-Key auth)
app.use('/api/v1/internal/*', serviceAuth(config.serviceKey));
app.route('/api/v1/internal', createInternalRoutes(accountService));

// ─── Start ──────────────────────────────────────────────────

console.log(`mana-mail starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
