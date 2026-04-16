/**
 * Sync Status Dropdown — composable for the PillNavigation sync pill.
 *
 * Returns reactive PillDropdownItems showing sync subscription state
 * (active / paused / inactive) with links to settings and credits.
 */

import { goto } from '$app/navigation';
import type { PillDropdownItem } from '@mana/shared-ui';
import { syncBilling } from '$lib/stores/sync-billing.svelte';

export function useSyncStatusItems() {
	const items = $derived.by(() => {
		const result: PillDropdownItem[] = [];

		if (syncBilling.active) {
			result.push({
				id: 'sync-active',
				label: 'Cloud Sync aktiv',
				icon: 'cloud',
				active: true,
				disabled: true,
			});
			if (syncBilling.nextChargeAt) {
				const date = new Date(syncBilling.nextChargeAt).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
				});
				result.push({
					id: 'sync-next',
					label: `Nächste Abbuchung: ${date}`,
					icon: 'calendar',
					disabled: true,
				});
			}
		} else if (syncBilling.paused) {
			result.push({
				id: 'sync-paused',
				label: 'Sync pausiert — Credits aufladen',
				icon: 'bell',
				onClick: () => goto('/?app=credits&tab=packages'),
			});
		} else {
			result.push({
				id: 'sync-inactive',
				label: 'Sync aktivieren',
				icon: 'cloud',
				onClick: () => goto('/settings/sync'),
			});
			result.push({
				id: 'sync-info',
				label: 'Nur lokal — ab 30 Credits/Monat',
				icon: 'creditCard',
				disabled: true,
			});
		}

		result.push({ id: 'sync-divider', label: '', divider: true });
		result.push({
			id: 'sync-settings',
			label: 'Sync-Einstellungen',
			icon: 'settings',
			onClick: () => goto('/settings/sync'),
		});

		return result;
	});

	const label = $derived(
		syncBilling.loading
			? '...'
			: syncBilling.active
				? 'Sync'
				: syncBilling.paused
					? 'Pausiert'
					: 'Lokal'
	);

	return {
		get items() {
			return items;
		},
		get label() {
			return label;
		},
	};
}
