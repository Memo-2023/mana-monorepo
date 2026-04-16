/**
 * Mood Tools — LLM-accessible operations for mood tracking.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { moodStore } from './stores/mood.svelte';
import { moodEntryTable } from './collections';
import { decryptRecords } from '$lib/data/crypto';
import {
	getAvgLevel,
	getTopEmotion,
	getValenceRatio,
	getActivityInsights,
	toMoodEntry,
} from './queries';
import { EMOTION_META, type CoreEmotion, type ActivityContext, type LocalMoodEntry } from './types';

function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

export const moodTools: ModuleTool[] = [
	{
		name: 'log_mood',
		module: 'mood',
		description:
			'Erfasst einen Mood-Check-in mit Level (1-10), primaerer Emotion und optionalem Kontext.',
		parameters: [
			{
				name: 'level',
				type: 'number',
				description: 'Stimmungs-Level von 1 (schlecht) bis 10 (super)',
				required: true,
			},
			{
				name: 'emotion',
				type: 'string',
				description: 'Primaere Emotion',
				required: true,
				enum: [
					'happy',
					'calm',
					'energized',
					'grateful',
					'excited',
					'loved',
					'hopeful',
					'neutral',
					'bored',
					'tired',
					'sad',
					'anxious',
					'angry',
					'stressed',
					'frustrated',
					'overwhelmed',
				],
			},
			{
				name: 'activity',
				type: 'string',
				description: 'Was machst du gerade?',
				required: false,
				enum: [
					'work',
					'exercise',
					'social',
					'alone',
					'commute',
					'eating',
					'resting',
					'creative',
					'outdoors',
					'screen',
					'chores',
					'other',
				],
			},
			{
				name: 'notes',
				type: 'string',
				description: 'Optionale Notiz zum Check-in',
				required: false,
			},
		],
		async execute(params) {
			const entry = await moodStore.logMood({
				level: params.level as number,
				emotion: params.emotion as CoreEmotion,
				activity: (params.activity as ActivityContext) ?? null,
				notes: (params.notes as string) ?? '',
			});
			const meta = EMOTION_META[params.emotion as CoreEmotion];
			return {
				success: true,
				data: entry,
				message: `Mood geloggt: ${meta.emoji} ${meta.de} (Level ${params.level}/10)`,
			};
		},
	},

	{
		name: 'get_mood_today',
		module: 'mood',
		description: 'Gibt alle heutigen Mood-Eintraege zurueck mit Durchschnitts-Level und Emotionen.',
		parameters: [],
		async execute() {
			const today = todayStr();
			const all = await moodEntryTable.toArray();
			const todayEntries = all.filter((e) => !e.deletedAt && e.date === today);
			const decrypted = await decryptRecords<LocalMoodEntry>('moodEntries', todayEntries);
			const entries = decrypted.map(toMoodEntry);

			if (entries.length === 0) {
				return {
					success: true,
					data: { entries: [], avgLevel: 0 },
					message: 'Noch kein Mood-Eintrag heute',
				};
			}

			const avgLevel = +(entries.reduce((s, e) => s + e.level, 0) / entries.length).toFixed(1);
			const emotions = entries.map((e) => {
				const meta = EMOTION_META[e.emotion];
				return {
					emotion: e.emotion,
					label: meta.de,
					emoji: meta.emoji,
					level: e.level,
					time: e.time,
				};
			});

			return {
				success: true,
				data: { entries: emotions, avgLevel, count: entries.length },
				message: `${entries.length} Check-ins heute, Durchschnitt: ${avgLevel}/10`,
			};
		},
	},

	{
		name: 'get_mood_insights',
		module: 'mood',
		description:
			'Gibt Mood-Trends und Muster zurueck: Durchschnitt der letzten 7/30 Tage, haeufigste Emotion, Positiv/Negativ-Verhaeltnis, und welche Aktivitaeten mit guter/schlechter Stimmung korrelieren.',
		parameters: [
			{
				name: 'days',
				type: 'number',
				description: 'Analyse-Zeitraum in Tagen (Standard: 7)',
				required: false,
			},
		],
		async execute(params) {
			const days = (params.days as number) ?? 7;
			const all = await moodEntryTable.toArray();
			const visible = all.filter((e) => !e.deletedAt);
			const decrypted = await decryptRecords<LocalMoodEntry>('moodEntries', visible);
			const entries = decrypted.map(toMoodEntry);

			// Filter to requested time window
			const cutoff = new Date();
			cutoff.setDate(cutoff.getDate() - days);
			const cutoffStr = cutoff.toISOString().split('T')[0];
			const windowEntries = entries.filter((e) => e.date >= cutoffStr);

			if (windowEntries.length === 0) {
				return {
					success: true,
					data: null,
					message: `Keine Mood-Daten in den letzten ${days} Tagen`,
				};
			}

			const avgLevel = getAvgLevel(entries, days);
			const topEmotion = getTopEmotion(windowEntries, windowEntries.length);
			const valence = getValenceRatio(windowEntries);
			const activities = getActivityInsights(windowEntries);

			const topEmotionMeta = topEmotion ? EMOTION_META[topEmotion] : null;

			return {
				success: true,
				data: {
					period: `${days} Tage`,
					totalEntries: windowEntries.length,
					avgLevel,
					topEmotion: topEmotion
						? { emotion: topEmotion, label: topEmotionMeta!.de, emoji: topEmotionMeta!.emoji }
						: null,
					valence,
					activityCorrelations: activities.slice(0, 5),
				},
				message: `${days}d: Ø ${avgLevel}/10, ${topEmotionMeta ? `meist ${topEmotionMeta.emoji} ${topEmotionMeta.de}` : '–'}, ${valence.positive}% positiv / ${valence.negative}% negativ`,
			};
		},
	},
];
