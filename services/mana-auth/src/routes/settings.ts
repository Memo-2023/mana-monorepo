/**
 * Settings routes — User settings CRUD (synced across all apps)
 *
 * GET    /              — Get all settings (global + app overrides + device settings)
 * PATCH  /global        — Update global settings (deep merge)
 * PATCH  /app/:appId    — Update app-specific override
 * DELETE /app/:appId    — Remove app override
 * PATCH  /device/:deviceId/:appId — Update device-specific app settings
 * GET    /devices       — List all devices
 * DELETE /device/:deviceId — Remove a device
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '../middleware/jwt-auth';
import type { Database } from '../db/connection';
import { userSettings } from '../db/schema/auth';

type SettingsApp = Hono<{ Variables: { user: AuthUser } }>;

/**
 * Deep merge two objects (1 level of nesting for settings)
 */
function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	const result = { ...target };
	for (const key of Object.keys(source)) {
		if (
			source[key] !== null &&
			typeof source[key] === 'object' &&
			!Array.isArray(source[key]) &&
			typeof result[key] === 'object' &&
			result[key] !== null &&
			!Array.isArray(result[key])
		) {
			result[key] = deepMerge(
				result[key] as Record<string, unknown>,
				source[key] as Record<string, unknown>
			);
		} else {
			result[key] = source[key];
		}
	}
	return result;
}

/**
 * Get or create user settings row
 */
async function getOrCreateSettings(db: Database, userId: string) {
	const [existing] = await db
		.select()
		.from(userSettings)
		.where(eq(userSettings.userId, userId))
		.limit(1);
	if (existing) return existing;

	const [created] = await db.insert(userSettings).values({ userId }).returning();
	return created;
}

/**
 * Return the standard response shape
 */
function settingsResponse(row: typeof userSettings.$inferSelect) {
	return {
		success: true,
		globalSettings: row.globalSettings,
		appOverrides: row.appOverrides,
		deviceSettings: row.deviceSettings,
	};
}

export function createSettingsRoutes(db: Database) {
	const app: SettingsApp = new Hono();

	// ─── GET / — Fetch all settings ────────────────────────────
	app.get('/', async (c) => {
		const user = c.get('user');
		const row = await getOrCreateSettings(db, user.userId);
		return c.json(settingsResponse(row));
	});

	// ─── PATCH /global — Update global settings (deep merge) ───
	app.patch('/global', async (c) => {
		const user = c.get('user');
		const body = await c.req.json();
		const row = await getOrCreateSettings(db, user.userId);

		const merged = deepMerge(
			row.globalSettings as Record<string, unknown>,
			body as Record<string, unknown>
		);

		const [updated] = await db
			.update(userSettings)
			.set({ globalSettings: merged, updatedAt: new Date() })
			.where(eq(userSettings.userId, user.userId))
			.returning();

		return c.json(settingsResponse(updated));
	});

	// ─── PATCH /app/:appId — Update app override ───────────────
	app.patch('/app/:appId', async (c) => {
		const user = c.get('user');
		const appId = c.req.param('appId');
		const body = await c.req.json();
		const row = await getOrCreateSettings(db, user.userId);

		const overrides = (row.appOverrides as Record<string, unknown>) || {};
		const existing = (overrides[appId] as Record<string, unknown>) || {};
		overrides[appId] = deepMerge(existing, body as Record<string, unknown>);

		const [updated] = await db
			.update(userSettings)
			.set({ appOverrides: overrides, updatedAt: new Date() })
			.where(eq(userSettings.userId, user.userId))
			.returning();

		return c.json(settingsResponse(updated));
	});

	// ─── DELETE /app/:appId — Remove app override ──────────────
	app.delete('/app/:appId', async (c) => {
		const user = c.get('user');
		const appId = c.req.param('appId');
		const row = await getOrCreateSettings(db, user.userId);

		const overrides = (row.appOverrides as Record<string, unknown>) || {};
		delete overrides[appId];

		const [updated] = await db
			.update(userSettings)
			.set({ appOverrides: overrides, updatedAt: new Date() })
			.where(eq(userSettings.userId, user.userId))
			.returning();

		return c.json(settingsResponse(updated));
	});

	// ─── PATCH /device/:deviceId/:appId — Update device app settings ──
	app.patch('/device/:deviceId/:appId', async (c) => {
		const user = c.get('user');
		const { deviceId, appId } = c.req.param();
		const body = await c.req.json<{
			deviceName?: string;
			deviceType?: string;
			settings?: Record<string, unknown>;
		}>();
		const row = await getOrCreateSettings(db, user.userId);

		const devices = (row.deviceSettings as Record<string, Record<string, unknown>>) || {};
		const device = devices[deviceId] || {
			deviceName: body.deviceName || 'Unknown',
			deviceType: body.deviceType || 'desktop',
			lastSeen: new Date().toISOString(),
			apps: {},
		};

		device.lastSeen = new Date().toISOString();
		if (body.deviceName) device.deviceName = body.deviceName;
		if (body.deviceType) device.deviceType = body.deviceType;

		const apps = (device.apps as Record<string, unknown>) || {};
		const existingApp = (apps[appId] as Record<string, unknown>) || {};
		apps[appId] = { ...existingApp, ...(body.settings || {}) };
		device.apps = apps;
		devices[deviceId] = device;

		const [updated] = await db
			.update(userSettings)
			.set({ deviceSettings: devices, updatedAt: new Date() })
			.where(eq(userSettings.userId, user.userId))
			.returning();

		return c.json(settingsResponse(updated));
	});

	// ─── GET /devices — List all devices ───────────────────────
	app.get('/devices', async (c) => {
		const user = c.get('user');
		const row = await getOrCreateSettings(db, user.userId);
		const devices = (row.deviceSettings as Record<string, Record<string, unknown>>) || {};

		const deviceList = Object.entries(devices).map(([id, d]) => ({
			deviceId: id,
			deviceName: d.deviceName || 'Unknown',
			deviceType: d.deviceType || 'desktop',
			lastSeen: d.lastSeen || null,
			appCount: Object.keys((d.apps as Record<string, unknown>) || {}).length,
		}));

		return c.json({ success: true, devices: deviceList });
	});

	// ─── DELETE /device/:deviceId — Remove a device ────────────
	app.delete('/device/:deviceId', async (c) => {
		const user = c.get('user');
		const deviceId = c.req.param('deviceId');
		const row = await getOrCreateSettings(db, user.userId);

		const devices = (row.deviceSettings as Record<string, unknown>) || {};
		delete devices[deviceId];

		const [updated] = await db
			.update(userSettings)
			.set({ deviceSettings: devices, updatedAt: new Date() })
			.where(eq(userSettings.userId, user.userId))
			.returning();

		return c.json(settingsResponse(updated));
	});

	return app;
}
