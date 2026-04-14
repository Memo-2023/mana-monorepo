/**
 * Food QuickInputBar Adapter
 *
 * Parses meal-type prefixes from the query so power users can type
 * "frühstück: müsli mit beeren" or "snack: apfel" without picking the
 * type from the UI. Falls back to time-of-day suggestion when no
 * prefix is given.
 */

import type { InputBarAdapter } from '$lib/quick-input/types';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { mealMutations } from './mutations';
import { suggestMealType, MEAL_TYPE_LABELS } from './constants';
import type { LocalMeal, MealType } from './types';

interface ParsedMealInput {
	mealType: MealType;
	description: string;
	hadExplicitPrefix: boolean;
}

// Map of recognised lowercase prefixes → MealType. Both German and
// English forms are accepted so the bar works regardless of UI locale.
const PREFIX_TO_MEALTYPE: Record<string, MealType> = {
	breakfast: 'breakfast',
	frühstück: 'breakfast',
	fruehstueck: 'breakfast',
	lunch: 'lunch',
	mittag: 'lunch',
	mittagessen: 'lunch',
	dinner: 'dinner',
	abend: 'dinner',
	abendessen: 'dinner',
	snack: 'snack',
	zwischendurch: 'snack',
};

export function parseMealInput(raw: string): ParsedMealInput {
	const trimmed = raw.trim();
	const colonIdx = trimmed.indexOf(':');
	if (colonIdx > 0 && colonIdx < 20) {
		const prefix = trimmed.slice(0, colonIdx).trim().toLowerCase();
		const rest = trimmed.slice(colonIdx + 1).trim();
		const mealType = PREFIX_TO_MEALTYPE[prefix];
		if (mealType && rest.length > 0) {
			return { mealType, description: rest, hadExplicitPrefix: true };
		}
	}
	return {
		mealType: suggestMealType(),
		description: trimmed,
		hadExplicitPrefix: false,
	};
}

export function createAdapter(): InputBarAdapter {
	return {
		placeholder: 'Mahlzeit hinzufügen oder suchen…',
		appIcon: 'food',
		deferSearch: true,
		createText: 'Hinzufügen',
		emptyText: 'Keine Mahlzeiten gefunden',

		async onSearch(query) {
			const q = query.toLowerCase();
			// `description` is encrypted on disk — decrypt before substring matching.
			const raw = await db.table<LocalMeal>('meals').toArray();
			const visible = raw.filter((m) => !m.deletedAt);
			const decrypted = await decryptRecords<LocalMeal>('meals', visible);
			return decrypted
				.filter((m) => m.description?.toLowerCase().includes(q))
				.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
				.slice(0, 10)
				.map((m) => ({
					id: m.id,
					title: m.description || '(ohne Beschreibung)',
					subtitle: `${MEAL_TYPE_LABELS[m.mealType]?.de ?? m.mealType}${
						m.nutrition ? ` · ${Math.round(m.nutrition.calories)} kcal` : ''
					}`,
				}));
		},

		onSelect() {
			// Selecting an existing meal is informational only — there's no
			// edit-in-place from the global bar. The user can navigate to
			// /food/[id] from the workbench card row instead.
		},

		onParseCreate(query) {
			if (!query.trim()) return null;
			const parsed = parseMealInput(query);
			const typeLabel = MEAL_TYPE_LABELS[parsed.mealType]?.de ?? parsed.mealType;
			return {
				title: `"${parsed.description}" als ${typeLabel} hinzufügen`,
				subtitle: parsed.hadExplicitPrefix
					? 'Mahlzeittyp aus Eingabe erkannt'
					: 'Mahlzeittyp aus Tageszeit',
			};
		},

		async onCreate(query) {
			if (!query.trim()) return;
			const parsed = parseMealInput(query);
			await mealMutations.create({
				mealType: parsed.mealType,
				description: parsed.description,
			});
		},
	};
}
