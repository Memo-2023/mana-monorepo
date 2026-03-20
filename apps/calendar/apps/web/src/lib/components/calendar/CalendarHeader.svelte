<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';

	// Format title based on view type
	let title = $derived.by(() => {
		const date = viewStore.currentDate;
		const rangeStart = viewStore.viewRange.start;
		const rangeEnd = viewStore.viewRange.end;

		const formatRange = () => {
			if (rangeStart.getMonth() === rangeEnd.getMonth()) {
				return (
					format(rangeStart, 'd.', { locale: de }) +
					' - ' +
					format(rangeEnd, 'd. MMMM yyyy', { locale: de })
				);
			}
			return (
				format(rangeStart, 'd. MMM', { locale: de }) +
				' - ' +
				format(rangeEnd, 'd. MMM yyyy', { locale: de })
			);
		};

		switch (viewStore.viewType) {
			case 'week':
				return formatRange();
			case 'month':
				return format(date, 'MMMM yyyy', { locale: de });
			case 'agenda':
				return 'Agenda';
			default:
				return format(date, 'MMMM yyyy', { locale: de });
		}
	});
</script>

<header class="calendar-header" role="banner">
	<h1 class="header-title" aria-live="polite">{title}</h1>
</header>

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
</style>
