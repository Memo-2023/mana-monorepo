<script lang="ts">
	import { Calendar, CheckSquare, Funnel } from '@manacore/shared-icons';
	import { FilterDropdown, type FilterDropdownOption } from '@manacore/shared-ui';

	interface Props {
		showEvents: boolean;
		showTodos: boolean;
		timeRange: '7' | '30' | 'all';
		onToggleEvents?: () => void;
		onToggleTodos?: () => void;
		onRangeChange?: (range: '7' | '30' | 'all') => void;
	}

	let {
		showEvents = true,
		showTodos = true,
		timeRange = '30',
		onToggleEvents,
		onToggleTodos,
		onRangeChange,
	}: Props = $props();

	const rangeOptions: FilterDropdownOption[] = [
		{ value: '7', label: '7 Tage' },
		{ value: '30', label: '30 Tage' },
		{ value: 'all', label: 'Alle' },
	];
</script>

<div class="agenda-filters">
	<div class="filter-group type-toggles">
		<button
			type="button"
			class="filter-toggle"
			class:active={showEvents}
			onclick={onToggleEvents}
			aria-pressed={showEvents}
		>
			<Calendar size={14} />
			<span>Events</span>
		</button>
		<button
			type="button"
			class="filter-toggle"
			class:active={showTodos}
			onclick={onToggleTodos}
			aria-pressed={showTodos}
		>
			<CheckSquare size={14} />
			<span>Aufgaben</span>
		</button>
	</div>

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
		justify-content: space-between;
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

	.type-toggles {
		display: flex;
		gap: 0.375rem;
	}

	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.filter-toggle:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.filter-toggle.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
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
