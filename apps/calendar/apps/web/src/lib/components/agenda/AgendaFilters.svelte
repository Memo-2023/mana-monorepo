<script lang="ts">
	import { Calendar, CheckSquare, Filter } from 'lucide-svelte';

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

	const rangeOptions = [
		{ value: '7' as const, label: '7 Tage' },
		{ value: '30' as const, label: '30 Tage' },
		{ value: 'all' as const, label: 'Alle' },
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
			<Filter size={14} />
			<select
				value={timeRange}
				onchange={(e) =>
					onRangeChange?.((e.target as HTMLSelectElement).value as '7' | '30' | 'all')}
			>
				{#each rangeOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
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

	.range-selector select {
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.range-selector select:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
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
