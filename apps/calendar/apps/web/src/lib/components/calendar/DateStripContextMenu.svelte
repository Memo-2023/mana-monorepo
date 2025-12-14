<script lang="ts">
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { Moon, Calendar, Eye, Columns, ArrowsIn } from '@manacore/shared-icons';
	import { settingsStore } from '$lib/stores/settings.svelte';

	// Context menu state
	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);

	// Build menu items based on current settings
	let menuItems = $derived.by((): ContextMenuItem[] => {
		return [
			{
				id: 'moon-phases',
				label: 'Mondphasen',
				icon: Moon,
				toggle: true,
				checked: settingsStore.dateStripShowMoonPhases,
				action: () => toggleSetting('dateStripShowMoonPhases'),
			},
			{
				id: 'event-indicators',
				label: 'Termin-Punkte',
				icon: Eye,
				toggle: true,
				checked: settingsStore.dateStripShowEventIndicators,
				action: () => toggleSetting('dateStripShowEventIndicators'),
			},
			{
				id: 'weekday',
				label: 'Wochentag',
				icon: Calendar,
				toggle: true,
				checked: settingsStore.dateStripShowWeekday,
				action: () => toggleSetting('dateStripShowWeekday'),
			},
			{
				id: 'week-numbers',
				label: 'Kalenderwochen',
				icon: Calendar,
				toggle: true,
				checked: settingsStore.dateStripShowWeekNumbers,
				action: () => toggleSetting('dateStripShowWeekNumbers'),
			},
			{
				id: 'divider-1',
				label: '',
				type: 'divider',
			},
			{
				id: 'highlight-weekends',
				label: 'Wochenenden hervorheben',
				icon: Calendar,
				toggle: true,
				checked: settingsStore.dateStripHighlightWeekends,
				action: () => toggleSetting('dateStripHighlightWeekends'),
			},
			{
				id: 'month-dividers',
				label: 'Monatstrennlinien',
				icon: Columns,
				toggle: true,
				checked: settingsStore.dateStripShowMonthDividers,
				action: () => toggleSetting('dateStripShowMonthDividers'),
			},
			{
				id: 'divider-2',
				label: '',
				type: 'divider',
			},
			{
				id: 'compact',
				label: 'Kompakte Ansicht',
				icon: ArrowsIn,
				toggle: true,
				checked: settingsStore.dateStripCompact,
				action: () => toggleSetting('dateStripCompact'),
			},
		];
	});

	function toggleSetting(key: keyof typeof settingsStore.settings) {
		const currentValue = settingsStore.settings[key];
		if (typeof currentValue === 'boolean') {
			settingsStore.set(key, !currentValue);
		}
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
