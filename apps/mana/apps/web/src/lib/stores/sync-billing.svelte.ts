/**
 * Sync Billing Store — tracks sync subscription state
 */

import { syncService, type BillingInterval } from '$lib/api/sync';

let active = $state(false);
let interval = $state<BillingInterval>('monthly');
let nextChargeAt = $state<string | null>(null);
let paused = $state(false);
let loading = $state(true);

export const syncBilling = {
	get active() {
		return active;
	},
	get interval() {
		return interval;
	},
	get nextChargeAt() {
		return nextChargeAt;
	},
	get paused() {
		return paused;
	},
	get loading() {
		return loading;
	},

	async load() {
		loading = true;
		try {
			const status = await syncService.getSyncStatus();
			active = status.active;
			interval = status.interval;
			nextChargeAt = status.nextChargeAt;
			paused = status.pausedAt !== null && !status.active;
		} catch (e) {
			console.error('[sync-billing] Failed to load status:', e);
			// Default to inactive on error
			active = false;
			paused = false;
		} finally {
			loading = false;
		}
	},

	async activate(billingInterval: BillingInterval = 'monthly') {
		const result = await syncService.activateSync(billingInterval);
		active = result.active;
		interval = result.interval;
		nextChargeAt = result.nextChargeAt;
		paused = false;
		return result;
	},

	async deactivate() {
		await syncService.deactivateSync();
		active = false;
		nextChargeAt = null;
		paused = false;
	},

	async changeInterval(newInterval: BillingInterval) {
		const result = await syncService.changeInterval(newInterval);
		interval = result.interval;
	},
};
