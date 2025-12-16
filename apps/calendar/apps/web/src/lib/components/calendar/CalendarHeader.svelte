<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import CalendarHeaderContextMenu from './CalendarHeaderContextMenu.svelte';

	let contextMenu: CalendarHeaderContextMenu;

	// Get weekday format string based on setting
	function getWeekdayFormat(): string {
		switch (settingsStore.headerWeekdayFormat) {
			case 'full':
				return 'EEEE';
			case 'short':
				return 'EEE';
			case 'hidden':
				return '';
		}
	}

	// Get date format string based on settings
	function getDateFormat(includeYear: boolean = true): string {
		const parts: string[] = [];

		// Weekday
		const weekdayFormat = getWeekdayFormat();
		if (weekdayFormat) {
			parts.push(weekdayFormat);
		}

		// Date with optional month
		if (settingsStore.headerShowDate) {
			if (settingsStore.headerAlwaysShowMonth) {
				parts.push(includeYear ? 'd.M. MMMM yyyy' : 'd.M.');
			} else {
				parts.push(includeYear ? 'd. MMMM yyyy' : 'd.');
			}
		} else if (includeYear) {
			// Only month and year if date is hidden
			parts.push('MMMM yyyy');
		}

		return parts.join(', ');
	}

	// Format title based on view type and settings
	let title = $derived.by(() => {
		const date = viewStore.currentDate;
		const rangeStart = viewStore.viewRange.start;
		const rangeEnd = viewStore.viewRange.end;

		// Helper to format date range
		const formatRange = () => {
			const showMonth = settingsStore.headerAlwaysShowMonth;
			const startFormat = showMonth ? 'd.M.' : 'd.';

			if (rangeStart.getMonth() === rangeEnd.getMonth()) {
				return (
					format(rangeStart, startFormat, { locale: de }) +
					' - ' +
					format(rangeEnd, showMonth ? 'd.M. MMMM yyyy' : 'd. MMMM yyyy', { locale: de })
				);
			}
			return (
				format(rangeStart, showMonth ? 'd.M. MMM' : 'd. MMM', { locale: de }) +
				' - ' +
				format(rangeEnd, showMonth ? 'd.M. MMM yyyy' : 'd. MMM yyyy', { locale: de })
			);
		};

		switch (viewStore.viewType) {
			case 'day':
				return format(date, getDateFormat(true), { locale: de });
			case '5day':
			case 'week':
			case '10day':
			case '14day':
				return formatRange();
			case 'month':
				return format(date, 'MMMM yyyy', { locale: de });
			case 'year':
				return format(date, 'yyyy', { locale: de });
			case 'agenda':
				return 'Agenda';
			default:
				return format(date, 'MMMM yyyy', { locale: de });
		}
	});

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		contextMenu.show(e.clientX, e.clientY);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
	class="calendar-header"
	class:compact={settingsStore.headerCompact}
	oncontextmenu={handleContextMenu}
>
	<h1 class="header-title">{title}</h1>
</header>

<CalendarHeaderContextMenu bind:this={contextMenu} />

<style>
	.calendar-header {
		padding: 0.75rem 1rem;
		background: transparent;
		cursor: context-menu;
	}

	.header-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	@media (max-width: 640px) {
		.header-title {
			font-size: 1rem;
		}
	}

	/* Compact variant */
	.calendar-header.compact {
		padding: 0.5rem 1rem;
	}

	.calendar-header.compact .header-title {
		font-size: 1rem;
	}

	@media (max-width: 640px) {
		.calendar-header.compact .header-title {
			font-size: 0.875rem;
		}
	}
</style>
