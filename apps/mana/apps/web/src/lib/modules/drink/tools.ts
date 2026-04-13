/**
 * Drink Tools — LLM-accessible operations for beverage tracking.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { drinkStore } from './stores/drink.svelte';
import { drinkEntryTable } from './collections';
import { decryptRecords } from '$lib/data/crypto';
import { DEFAULT_DAILY_GOAL_ML, type DrinkType, type LocalDrinkEntry } from './types';

export const drinkTools: ModuleTool[] = [
	{
		name: 'log_drink',
		module: 'drink',
		description: 'Loggt ein Getraenk (Wasser, Kaffee, Tee, etc.)',
		parameters: [
			{
				name: 'drinkType',
				type: 'string',
				description: 'Art des Getraenks',
				required: true,
				enum: ['water', 'coffee', 'tea', 'juice', 'alcohol', 'smoothie', 'soda', 'other'],
			},
			{ name: 'quantityMl', type: 'number', description: 'Menge in Milliliter', required: true },
			{
				name: 'name',
				type: 'string',
				description: 'Name (z.B. "Latte Macchiato")',
				required: false,
			},
		],
		async execute(params) {
			const entry = await drinkStore.logDrink({
				name: (params.name as string) ?? (params.drinkType as string),
				drinkType: params.drinkType as DrinkType,
				quantityMl: params.quantityMl as number,
			});
			return {
				success: true,
				data: entry,
				message: `${params.quantityMl}ml ${params.name ?? params.drinkType} geloggt`,
			};
		},
	},
	{
		name: 'get_drink_progress',
		module: 'drink',
		description: 'Gibt den heutigen Trink-Fortschritt zurueck (Wasser, Kaffee, gesamt)',
		parameters: [],
		async execute() {
			const today = new Date().toISOString().split('T')[0];
			const all = await drinkEntryTable.toArray();
			const todayEntries = all.filter((e) => !e.deletedAt && e.date === today);
			const decrypted = await decryptRecords<LocalDrinkEntry>('drinkEntries', todayEntries);

			let waterMl = 0;
			let coffeeMl = 0;
			let coffeeCount = 0;
			let totalMl = 0;
			for (const d of decrypted) {
				const ml = d.quantityMl ?? 0;
				totalMl += ml;
				if (d.drinkType === 'water') waterMl += ml;
				if (d.drinkType === 'coffee') {
					coffeeMl += ml;
					coffeeCount++;
				}
			}

			return {
				success: true,
				data: {
					water: {
						ml: waterMl,
						goal: DEFAULT_DAILY_GOAL_ML,
						percent: Math.round((waterMl / DEFAULT_DAILY_GOAL_ML) * 100),
					},
					coffee: { ml: coffeeMl, count: coffeeCount },
					total: { ml: totalMl, count: decrypted.length },
				},
				message: `Wasser: ${waterMl}/${DEFAULT_DAILY_GOAL_ML}ml (${Math.round((waterMl / DEFAULT_DAILY_GOAL_ML) * 100)}%), ${decrypted.length} Getraenke gesamt`,
			};
		},
	},
	{
		name: 'undo_last_drink',
		module: 'drink',
		description: 'Macht den letzten Getraenk-Eintrag rueckgaengig',
		parameters: [],
		async execute() {
			await drinkStore.undoLastEntry();
			return { success: true, message: 'Letzter Eintrag rueckgaengig gemacht' };
		},
	},
];
