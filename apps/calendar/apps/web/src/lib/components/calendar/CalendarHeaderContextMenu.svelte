<script lang="ts">
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { ArrowsIn, TextAa, Calendar, CalendarBlank } from '@manacore/shared-icons';
	import { settingsStore, type WeekdayFormat } from '$lib/stores/settings.svelte';

	// Context menu state
	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);

	// Build menu items based on current settings
	let menuItems = $derived.by((): ContextMenuItem[] => {
		return [
			{
				id: 'compact',
				label: 'Kompakte Ansicht',
				icon: ArrowsIn,
				toggle: true,
				checked: settingsStore.headerCompact,
				action: () => toggleSetting('headerCompact'),
			},
			{
				id: 'divider-1',
				label: '',
				type: 'divider',
			},
			{
				id: 'weekday-full',
				label: 'Wochentag ausgeschrieben',
				icon: TextAa,
				toggle: true,
				checked: settingsStore.headerWeekdayFormat === 'full',
				action: () => setWeekdayFormat('full'),
			},
			{
				id: 'weekday-short',
				label: 'Wochentag gekürzt',
				icon: TextAa,
				toggle: true,
				checked: settingsStore.headerWeekdayFormat === 'short',
				action: () => setWeekdayFormat('short'),
			},
			{
				id: 'weekday-hidden',
				label: 'Wochentag ausblenden',
				icon: TextAa,
				toggle: true,
				checked: settingsStore.headerWeekdayFormat === 'hidden',
				action: () => setWeekdayFormat('hidden'),
			},
			{
				id: 'divider-2',
				label: '',
				type: 'divider',
			},
			{
				id: 'show-date',
				label: 'Datum anzeigen',
				icon: Calendar,
				toggle: true,
				checked: settingsStore.headerShowDate,
				action: () => toggleSetting('headerShowDate'),
			},
			{
				id: 'always-show-month',
				label: 'Monat immer anzeigen',
				icon: CalendarBlank,
				toggle: true,
				checked: settingsStore.headerAlwaysShowMonth,
				action: () => toggleSetting('headerAlwaysShowMonth'),
			},
		];
	});

	function toggleSetting(key: keyof typeof settingsStore.settings) {
		const currentValue = settingsStore.settings[key];
		if (typeof currentValue === 'boolean') {
			settingsStore.set(key, !currentValue);
		}
	}

	function setWeekdayFormat(format: WeekdayFormat) {
		settingsStore.set('headerWeekdayFormat', format);
	}

	function handleClose() {
		visible = false;
	}

	// Export show function to be called from parent
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
