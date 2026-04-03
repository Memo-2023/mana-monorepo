import { registerEntity } from '$lib/entities/registry';
import { financeStore } from './stores/finance.svelte';
import type { EntityDescriptor } from '$lib/entities/types';

const financeEntity: EntityDescriptor = {
	appId: 'finance',
	collection: 'transactions',
	paramKey: 'transactionId',

	getDisplayData: (item) => ({
		title: (item.description as string) || 'Transaktion',
		subtitle: item.amount ? `${item.type === 'income' ? '+' : '-'}${item.amount}` : undefined,
	}),

	dragType: 'transaction',
	acceptsDropFrom: [],

	createItem: async (data) => {
		const tx = await financeStore.addTransaction({
			type: 'expense',
			amount: (data.amount as number) ?? 0,
			description: (data.title as string) ?? (data.description as string) ?? '',
		});
		return tx.id;
	},
};

registerEntity(financeEntity);
