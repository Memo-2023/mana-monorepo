/**
 * Meditate module — collection accessors and guest seed data.
 *
 * Tables: meditatePresets, meditateSessions, meditateSettings.
 */

import { db } from '$lib/data/database';
import type { LocalMeditatePreset, LocalMeditateSession, LocalMeditateSettings } from './types';
import { DEFAULT_PRESETS } from './default-presets';

// ─── Collection Accessors ───────────────────────────────────

export const meditatePresetTable = db.table<LocalMeditatePreset>('meditatePresets');
export const meditateSessionTable = db.table<LocalMeditateSession>('meditateSessions');
export const meditateSettingsTable = db.table<LocalMeditateSettings>('meditateSettings');

// ─── Guest Seed ─────────────────────────────────────────────

export const MEDITATE_GUEST_SEED = {
	meditatePresets: DEFAULT_PRESETS as unknown as Record<string, unknown>[],
	meditateSessions: [] as Record<string, unknown>[],
	meditateSettings: [] as Record<string, unknown>[],
};
