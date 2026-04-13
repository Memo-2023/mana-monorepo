import type { ModuleTool } from '$lib/data/tools/types';
import { financeStore } from './stores/finance.svelte';

export const financeTools: ModuleTool[] = [
	{
		name: 'add_transaction',
		module: 'finance',
		description: 'Erfasst eine Einnahme oder Ausgabe',
		parameters: [
			{
				name: 'type',
				type: 'string',
				description: 'Art',
				required: true,
				enum: ['income', 'expense'],
			},
			{ name: 'amount', type: 'number', description: 'Betrag in Euro', required: true },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: true },
		],
		async execute(params) {
			const tx = await financeStore.addTransaction({
				type: params.type as 'income' | 'expense',
				amount: params.amount as number,
				description: params.description as string,
			});
			return {
				success: true,
				data: tx,
				message: `${params.type === 'income' ? 'Einnahme' : 'Ausgabe'}: ${params.amount}€ (${params.description})`,
			};
		},
	},
];
