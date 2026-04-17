/**
 * Wishes Tools — LLM-accessible operations for the wishes module.
 */

import type { ModuleTool } from '$lib/data/tools/types';

export const wishesTools: ModuleTool[] = [
	{
		name: 'create_wish',
		module: 'wishes',
		description:
			'Erstellt einen neuen Wunsch auf der Wunschliste. Nutze dies wenn der Nutzer sich etwas wünscht oder eine Geschenkidee hat.',
		parameters: [
			{ name: 'title', type: 'string', description: 'Wunsch-Titel', required: true },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
			{
				name: 'priority',
				type: 'string',
				description: 'Priorität',
				required: false,
				enum: ['low', 'medium', 'high'],
			},
			{
				name: 'targetPrice',
				type: 'number',
				description: 'Zielpreis / Budget in EUR',
				required: false,
			},
			{
				name: 'category',
				type: 'string',
				description: 'Kategorie (z.B. Technik, Bücher)',
				required: false,
			},
		],
		async execute(params) {
			const { wishesStore } = await import('./stores/wishes.svelte');
			const wish = await wishesStore.create({
				title: params.title as string,
				description: params.description as string | undefined,
				priority: (params.priority as 'low' | 'medium' | 'high') ?? undefined,
				targetPrice: params.targetPrice as number | undefined,
				category: params.category as string | undefined,
			});
			return { success: true, data: wish, message: `Wunsch "${wish.title}" erstellt` };
		},
	},
	{
		name: 'list_wishes',
		module: 'wishes',
		description:
			'Listet alle Wünsche auf der Wunschliste. Nutze dies wenn der Nutzer nach seinen Wünschen fragt.',
		parameters: [
			{
				name: 'filter',
				type: 'string',
				description: 'Nach Status filtern',
				required: false,
				enum: ['active', 'fulfilled', 'all'],
			},
		],
		async execute(params) {
			const { wishTable } = await import('./collections');
			const { toWish } = await import('./queries');
			const { decryptRecords } = await import('$lib/data/crypto');
			const all = await wishTable.toArray();
			const active = all.filter((w) => !w.deletedAt);
			const decrypted = await decryptRecords('wishesItems', active);
			const wishes = decrypted.map(toWish);

			const filter = (params.filter as string) ?? 'active';
			let filtered = wishes;
			if (filter === 'active') filtered = wishes.filter((w) => w.status === 'active');
			else if (filter === 'fulfilled') filtered = wishes.filter((w) => w.status === 'fulfilled');

			const list = filtered.map((w) => ({
				id: w.id,
				title: w.title,
				priority: w.priority,
				targetPrice: w.targetPrice,
				currency: w.currency,
				category: w.category,
				status: w.status,
			}));

			return {
				success: true,
				data: list,
				message:
					list.length === 0
						? `Keine ${filter === 'all' ? '' : filter + 'n'} Wünsche`
						: `${list.length} Wünsche gefunden`,
			};
		},
	},
	{
		name: 'fulfill_wish',
		module: 'wishes',
		description: 'Markiert einen Wunsch als erfüllt.',
		parameters: [
			{ name: 'wishId', type: 'string', description: 'ID des Wunsches', required: true },
		],
		async execute(params) {
			const { wishesStore } = await import('./stores/wishes.svelte');
			await wishesStore.fulfill(params.wishId as string);
			return { success: true, message: 'Wunsch als erfüllt markiert' };
		},
	},
];
