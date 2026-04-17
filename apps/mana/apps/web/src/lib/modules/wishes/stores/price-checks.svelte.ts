/**
 * Price Checks Store — Mutations Only
 */

import { priceCheckTable } from '../collections';
import type { LocalPriceCheck } from '../types';

export const priceChecksStore = {
	async record(data: {
		wishId: string;
		url: string;
		price: number;
		currency: string;
		available?: boolean;
	}) {
		const now = new Date().toISOString();
		const newLocal: LocalPriceCheck = {
			id: crypto.randomUUID(),
			wishId: data.wishId,
			url: data.url,
			price: data.price,
			currency: data.currency,
			available: data.available ?? true,
			checkedAt: now,
		};
		await priceCheckTable.add(newLocal);
		return newLocal;
	},
};
