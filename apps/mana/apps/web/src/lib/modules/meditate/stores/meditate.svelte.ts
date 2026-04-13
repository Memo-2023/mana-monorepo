/**
 * Meditate Store — mutation-only service for the meditate module.
 *
 * All reads happen via liveQuery hooks in queries.ts. This file only writes:
 * preset CRUD, session logging, and settings updates.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { meditatePresetTable, meditateSessionTable, meditateSettingsTable } from '../collections';
import { toMeditatePreset, toMeditateSession, toMeditateSettings } from '../queries';
import type {
	LocalMeditatePreset,
	LocalMeditateSession,
	LocalMeditateSettings,
	MeditateCategory,
	BreathPattern,
	BellSound,
	BackgroundTheme,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';

export const meditateStore = {
	// ─── Presets ─────────────────────────────────────────────

	async createPreset(input: {
		name: string;
		description?: string;
		category: MeditateCategory;
		breathPattern?: BreathPattern | null;
		bodyScanSteps?: string[] | null;
		defaultDurationSec?: number;
	}) {
		const existing = await meditatePresetTable.toArray();
		const order = existing.filter((p) => !p.deletedAt).length;

		const newLocal: LocalMeditatePreset = {
			id: crypto.randomUUID(),
			name: input.name,
			description: input.description ?? '',
			category: input.category,
			breathPattern: input.breathPattern ?? null,
			bodyScanSteps: input.bodyScanSteps ?? null,
			defaultDurationSec: input.defaultDurationSec ?? 300,
			isPreset: false,
			isArchived: false,
			order,
		};
		const snapshot = toMeditatePreset({ ...newLocal });
		await encryptRecord('meditatePresets', newLocal);
		await meditatePresetTable.add(newLocal);
		return snapshot;
	},

	async updatePreset(
		id: string,
		patch: Partial<
			Pick<
				LocalMeditatePreset,
				| 'name'
				| 'description'
				| 'category'
				| 'breathPattern'
				| 'bodyScanSteps'
				| 'defaultDurationSec'
				| 'isArchived'
				| 'order'
			>
		>
	) {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('meditatePresets', wrapped);
		await meditatePresetTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deletePreset(id: string) {
		await meditatePresetTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	// ─── Sessions ───────────────────────────────────────────

	async logSession(input: {
		presetId: string | null;
		category: MeditateCategory;
		startedAt: string;
		durationSec: number;
		completed: boolean;
		moodBefore?: number | null;
		moodAfter?: number | null;
		notes?: string | null;
	}) {
		const newLocal: LocalMeditateSession = {
			id: crypto.randomUUID(),
			presetId: input.presetId,
			category: input.category,
			startedAt: input.startedAt,
			durationSec: input.durationSec,
			completed: input.completed,
			moodBefore: input.moodBefore ?? null,
			moodAfter: input.moodAfter ?? null,
			notes: input.notes ?? null,
		};
		const snapshot = toMeditateSession({ ...newLocal });
		await encryptRecord('meditateSessions', newLocal);
		await meditateSessionTable.add(newLocal);
		emitDomainEvent('MeditationCompleted', 'meditate', 'meditateSessions', newLocal.id, {
			sessionId: newLocal.id,
			category: input.category,
			durationMinutes: Math.round(input.durationSec / 60),
			completed: input.completed,
		});
		return snapshot;
	},

	async updateSession(
		id: string,
		patch: Partial<Pick<LocalMeditateSession, 'moodAfter' | 'notes'>>
	) {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('meditateSessions', wrapped);
		await meditateSessionTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteSession(id: string) {
		await meditateSessionTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	// ─── Settings ───────────────────────────────────────────

	async updateSettings(
		patch: Partial<
			Pick<
				LocalMeditateSettings,
				'bellSound' | 'intervalBell' | 'intervalSeconds' | 'showBreathGuide' | 'backgroundTheme'
			>
		>
	) {
		const existing = await meditateSettingsTable.get('settings');
		if (existing) {
			await meditateSettingsTable.update('settings', {
				...patch,
				updatedAt: new Date().toISOString(),
			});
		} else {
			const newSettings: LocalMeditateSettings = {
				id: 'settings',
				...DEFAULT_SETTINGS,
				...patch,
			};
			await meditateSettingsTable.add(newSettings);
		}
	},
};
