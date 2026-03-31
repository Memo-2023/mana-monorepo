/**
 * Settings routes for Memoro server.
 *
 * Reads/writes user settings from the Supabase `profiles` table.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@manacore/shared-hono';
import { createServiceClient } from '../lib/supabase';

export const settingsRoutes = new Hono<{ Variables: AuthVariables }>();

// GET / — get all user settings
settingsRoutes.get('/', async (c) => {
	const userId = c.get('userId') as string;
	const supabase = createServiceClient();

	const { data: profile, error } = await supabase
		.from('profiles')
		.select('*')
		.eq('user_id', userId)
		.maybeSingle();

	if (error) {
		console.error('[settings] Get all error:', error);
		return c.json({ error: 'Failed to get settings' }, 500);
	}

	return c.json({ settings: profile ?? {} });
});

// GET /memoro — get memoro-specific settings
settingsRoutes.get('/memoro', async (c) => {
	const userId = c.get('userId') as string;
	const supabase = createServiceClient();

	const { data: profile, error } = await supabase
		.from('profiles')
		.select('app_settings, display_name, avatar_url')
		.eq('user_id', userId)
		.maybeSingle();

	if (error) {
		console.error('[settings] Get memoro error:', error);
		return c.json({ error: 'Failed to get memoro settings' }, 500);
	}

	const appSettings = (profile as { app_settings?: Record<string, unknown> } | null)?.app_settings ?? {};
	const memoroSettings = (appSettings.memoro as Record<string, unknown>) ?? {};

	return c.json({ settings: memoroSettings });
});

// PATCH /memoro — update memoro settings
settingsRoutes.patch('/memoro', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<Record<string, unknown>>();
	const supabase = createServiceClient();

	// Get current settings
	const { data: profile, error: fetchError } = await supabase
		.from('profiles')
		.select('app_settings')
		.eq('user_id', userId)
		.maybeSingle();

	if (fetchError) {
		return c.json({ error: 'Failed to fetch current settings' }, 500);
	}

	const currentSettings =
		(profile as { app_settings?: Record<string, unknown> } | null)?.app_settings ?? {};
	const currentMemoro = (currentSettings.memoro as Record<string, unknown>) ?? {};

	const updatedSettings = {
		...currentSettings,
		memoro: { ...currentMemoro, ...body },
	};

	const { error: upsertError } = await supabase.from('profiles').upsert(
		{
			user_id: userId,
			app_settings: updatedSettings,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: 'user_id' }
	);

	if (upsertError) {
		console.error('[settings] Update memoro error:', upsertError);
		return c.json({ error: 'Failed to update memoro settings' }, 500);
	}

	return c.json({ success: true, settings: { ...currentMemoro, ...body } });
});

// PATCH /memoro/data-usage — update data usage acceptance flag
settingsRoutes.patch('/memoro/data-usage', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{ accepted: boolean }>();
	const supabase = createServiceClient();

	const { data: profile, error: fetchError } = await supabase
		.from('profiles')
		.select('app_settings')
		.eq('user_id', userId)
		.maybeSingle();

	if (fetchError) {
		return c.json({ error: 'Failed to fetch current settings' }, 500);
	}

	const currentSettings =
		(profile as { app_settings?: Record<string, unknown> } | null)?.app_settings ?? {};
	const currentMemoro = (currentSettings.memoro as Record<string, unknown>) ?? {};

	const updatedSettings = {
		...currentSettings,
		memoro: {
			...currentMemoro,
			dataUsageAcceptance: body.accepted,
			dataUsageAcceptedAt: body.accepted ? new Date().toISOString() : null,
		},
	};

	const { error: upsertError } = await supabase.from('profiles').upsert(
		{
			user_id: userId,
			app_settings: updatedSettings,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: 'user_id' }
	);

	if (upsertError) {
		console.error('[settings] Update data-usage error:', upsertError);
		return c.json({ error: 'Failed to update data usage settings' }, 500);
	}

	return c.json({ success: true, dataUsageAcceptance: body.accepted });
});

// PATCH /profile — update user profile fields
settingsRoutes.patch('/profile', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{
		display_name?: string;
		avatar_url?: string;
		bio?: string;
	}>();

	const allowedFields = ['display_name', 'avatar_url', 'bio'] as const;
	const updateData: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };

	for (const field of allowedFields) {
		if (body[field] !== undefined) {
			updateData[field] = body[field];
		}
	}

	if (Object.keys(updateData).length <= 2) {
		return c.json({ error: 'No valid fields provided' }, 400);
	}

	const supabase = createServiceClient();

	const { error } = await supabase
		.from('profiles')
		.upsert(updateData, { onConflict: 'user_id' });

	if (error) {
		console.error('[settings] Update profile error:', error);
		return c.json({ error: 'Failed to update profile' }, 500);
	}

	return c.json({ success: true });
});
