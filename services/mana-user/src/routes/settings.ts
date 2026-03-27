import { Hono } from 'hono';
import type { SettingsService } from '../services/settings';
import type { AuthUser } from '../middleware/jwt-auth';

export function createSettingsRoutes(settingsService: SettingsService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/', async (c) => {
			const user = c.get('user');
			return c.json(await settingsService.getSettings(user.userId));
		})
		.put('/global', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			return c.json(await settingsService.updateGlobalSettings(user.userId, body));
		})
		.put('/app/:appId', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			return c.json(
				await settingsService.updateAppOverride(user.userId, c.req.param('appId'), body)
			);
		})
		.put('/device/:deviceId', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			return c.json(
				await settingsService.updateDeviceSettings(user.userId, c.req.param('deviceId'), body)
			);
		});
}
