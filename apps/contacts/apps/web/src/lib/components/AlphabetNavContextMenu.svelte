<script lang="ts">
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { EyeSlash, ArrowsDownUp, Hash, ArrowsIn, ArrowsOut } from '@manacore/shared-icons';
	import { contactsSettings } from '$lib/stores/settings.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';

	// Context menu state
	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);

	// Build menu items based on current settings
	let menuItems = $derived.by((): ContextMenuItem[] => {
		return [
			{
				id: 'hide-inactive',
				label: 'Inaktive Buchstaben ausblenden',
				icon: EyeSlash,
				toggle: true,
				checked: contactsSettings.alphabetNavHideInactive,
				action: () =>
					contactsSettings.set(
						'alphabetNavHideInactive',
						!contactsSettings.alphabetNavHideInactive
					),
			},
			{
				id: 'compact',
				label: 'Kompakte Ansicht',
				icon: ArrowsIn,
				toggle: true,
				checked: contactsSettings.alphabetNavCompact,
				action: () =>
					contactsSettings.set('alphabetNavCompact', !contactsSettings.alphabetNavCompact),
			},
			{
				id: 'reverse-order',
				label: 'Umgekehrte Reihenfolge (Z-A)',
				icon: ArrowsDownUp,
				toggle: true,
				checked: contactsSettings.alphabetNavReverseOrder,
				action: () =>
					contactsSettings.set(
						'alphabetNavReverseOrder',
						!contactsSettings.alphabetNavReverseOrder
					),
			},
			{
				id: 'show-hash',
				label: '# Symbol anzeigen',
				icon: Hash,
				toggle: true,
				checked: contactsSettings.alphabetNavShowHash,
				action: () =>
					contactsSettings.set('alphabetNavShowHash', !contactsSettings.alphabetNavShowHash),
			},
			{
				id: 'divider-1',
				label: '',
				type: 'divider',
			},
			{
				id: 'minimize',
				label: contactsFilterStore.isAlphabetNavCollapsed ? 'Erweitern' : 'Minimieren',
				icon: contactsFilterStore.isAlphabetNavCollapsed ? ArrowsOut : ArrowsIn,
				action: () => contactsFilterStore.toggleAlphabetNav(),
			},
		];
	});

	function handleClose() {
		visible = false;
	}

	export function show(clientX: number, clientY: number) {
		x = clientX;
		y = clientY;
		visible = true;
	}

	export function hide() {
		visible = false;
	}
</script>

<ContextMenu {visible} {x} {y} items={menuItems} onClose={handleClose} />
