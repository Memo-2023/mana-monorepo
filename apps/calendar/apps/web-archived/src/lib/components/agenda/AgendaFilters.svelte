<script lang="ts">
	import { Funnel } from '@manacore/shared-icons';
	import { FilterDropdown, type FilterDropdownOption } from '@manacore/shared-ui';

	interface Props {
		timeRange: '7' | '30' | 'all';
		onRangeChange?: (range: '7' | '30' | 'all') => void;
	}

	let { timeRange = '30', onRangeChange }: Props = $props();

	const rangeOptions: FilterDropdownOption[] = [
		{ value: '7', label: '7 Tage' },
		{ value: '30', label: '30 Tage' },
		{ value: 'all', label: 'Alle' },
	];
</script>

<div class="agenda-filters">
	<div class="filter-group">
		<div class="range-selector">
			<Funnel size={14} />
			<FilterDropdown
				options={rangeOptions}
				value={timeRange}
				onChange={(v) => onRangeChange?.(v as '7' | '30' | 'all')}
				placeholder="Zeitraum"
				embedded={true}
			/>
		</div>
	</div>
</div>

<style>
	.agenda-filters {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border));
	}
	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.range-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--color-muted-foreground));
	}
	@media (max-width: 480px) {
		.agenda-filters {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		.filter-group {
			justify-content: center;
		}
	}
</style>
