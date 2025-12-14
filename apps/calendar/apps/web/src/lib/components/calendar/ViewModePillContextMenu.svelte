<script lang="ts">
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { Calendar, ListBullets, GridFour, CalendarBlank } from '@manacore/shared-icons';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { CalendarViewType } from '@calendar/shared';

	// Context menu state
	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);

	// View labels
	const viewLabels: Record<CalendarViewType, string> = {
		day: 'Tag',
		'5day': '5 Tage',
		week: 'Woche',
		'10day': '10 Tage',
		'14day': '14 Tage',
		month: 'Monat',
		year: 'Jahr',
		agenda: 'Agenda',
	};

	// All available views
	const allViews: CalendarViewType[] = [
		'day',
		'5day',
		'week',
		'10day',
		'14day',
		'month',
		'year',
		'agenda',
	];

	function isViewEnabled(view: CalendarViewType): boolean {
		return settingsStore.quickViewPillViews.includes(view);
	}

	function toggleView(view: CalendarViewType) {
		const current = settingsStore.quickViewPillViews;
		if (current.includes(view)) {
			// Remove view (but keep at least one)
			if (current.length > 1) {
				settingsStore.set(
					'quickViewPillViews',
					current.filter((v) => v !== view)
				);
			}
		} else {
			// Add view
			settingsStore.set('quickViewPillViews', [...current, view]);
		}
	}

	// Build menu items
	let menuItems = $derived.by((): ContextMenuItem[] => {
		return allViews.map((view) => ({
			id: view,
			label: viewLabels[view],
			icon: getViewIcon(view),
			toggle: true,
			checked: isViewEnabled(view),
			action: () => toggleView(view),
		}));
	});

	// Get appropriate icon for view type
	function getViewIcon(view: CalendarViewType) {
		switch (view) {
			case 'day':
			case '5day':
			case '10day':
			case '14day':
				return CalendarBlank;
			case 'week':
				return Calendar;
			case 'month':
			case 'year':
				return GridFour;
			case 'agenda':
				return ListBullets;
			default:
				return Calendar;
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
