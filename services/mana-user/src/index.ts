/**
 * mana-user — User preferences, tags, and storage service
 *
 * Hono + Bun runtime. Extracted from mana-core-auth.
 * Handles: user settings, tags, tag groups, tag links, avatar storage.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
import { TagsService } from './services/tags';
import { SettingsService } from './services/settings';
import { healthRoutes } from './routes/health';
import { createTagRoutes } from './routes/tags';
import { createTagGroupRoutes } from './routes/tag-groups';
import { createTagLinkRoutes } from './routes/tag-links';
import { createSettingsRoutes } from './routes/settings';

const config = loadConfig();
const db = getDb(config.databaseUrl);

const tagsService = new TagsService(db);
const settingsService = new SettingsService(db);

const app = new Hono();

app.onError(errorHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

// Health (no auth)
app.route('/health', healthRoutes);

// All API routes require JWT auth
app.use('/api/v1/*', jwtAuth(config.manaAuthUrl));

// Routes
app.route('/api/v1/tags', createTagRoutes(tagsService));
app.route('/api/v1/tag-groups', createTagGroupRoutes(tagsService));
app.route('/api/v1/tag-links', createTagLinkRoutes(tagsService));
app.route('/api/v1/settings', createSettingsRoutes(settingsService));

console.log(`mana-user starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
