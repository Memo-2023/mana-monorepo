<script lang="ts">
	import {
		Warning,
		Calendar,
		CalendarDots,
		CheckCircle,
		Star,
		Lightning,
		Clock,
		Fire,
		Leaf,
		Heart,
		Trash,
	} from '@mana/shared-icons';
	import type { PageIcon, PageConfig } from '../../stores/settings.svelte';

	interface Props {
		config: PageConfig;
		onUpdate: (data: Partial<PageConfig>) => void;
		onDelete: () => void;
	}

	let { config, onUpdate, onDelete }: Props = $props();

	const ICONS: { id: PageIcon; component: typeof Warning }[] = [
		{ id: 'warning', component: Warning },
		{ id: 'calendar', component: Calendar },
		{ id: 'calendar-dots', component: CalendarDots },
		{ id: 'check', component: CheckCircle },
		{ id: 'star', component: Star },
		{ id: 'lightning', component: Lightning },
		{ id: 'clock', component: Clock },
		{ id: 'fire', component: Fire },
		{ id: 'leaf', component: Leaf },
		{ id: 'heart', component: Heart },
	];

	const PRIORITIES = [
		{ id: 'urgent' as const, label: 'Dringend', color: '#EF4444' },
		{ id: 'high' as const, label: 'Hoch', color: '#F59E0B' },
		{ id: 'medium' as const, label: 'Mittel', color: '#3B82F6' },
		{ id: 'low' as const, label: 'Niedrig', color: '#6B7280' },
	];

	const DATE_RANGES = [
		{ id: 'overdue' as const, label: 'Überfällig' },
		{ id: 'today' as const, label: 'Heute' },
		{ id: 'tomorrow' as const, label: 'Morgen' },
		{ id: 'upcoming' as const, label: 'Demnächst' },
		{ id: 'any' as const, label: 'Alle' },
	];

	function togglePriority(p: 'low' | 'medium' | 'high' | 'urgent') {
		const current = config.filter.priorities ?? [];
		const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
		onUpdate({ filter: { ...config.filter, priorities: next.length ? next : undefined } });
	}

	function setDateRange(range: typeof config.filter.dateRange) {
		onUpdate({
			filter: {
				...config.filter,
				dateRange: range === config.filter.dateRange ? undefined : range,
			},
		});
	}

	function toggleCompleted() {
		onUpdate({ filter: { ...config.filter, completed: !config.filter.completed } });
	}

	function setIcon(icon: PageIcon) {
		onUpdate({ icon });
	}

	let showFilters = $state(false);
</script>

<div class="edit-bar">
	<div class="edit-row icons-row">
		{#each ICONS as icon (icon.id)}
			<button
				class="icon-btn"
				class:active={config.icon === icon.id}
				onclick={() => setIcon(icon.id)}
				title={icon.id}
			>
				<icon.component size={16} weight={config.icon === icon.id ? 'fill' : 'regular'} />
			</button>
		{/each}
	</div>

	<button class="filter-toggle" onclick={() => (showFilters = !showFilters)}>
		<span class="filter-toggle-label">Filter</span>
		<span class="filter-toggle-arrow" class:open={showFilters}>&#9662;</span>
	</button>

	{#if showFilters}
		<div class="edit-row filter-section">
			<div class="filter-group">
				<span class="filter-label">Priorität</span>
				<div class="filter-pills">
					{#each PRIORITIES as p (p.id)}
						<button
							class="filter-pill"
							class:active={config.filter.priorities?.includes(p.id)}
							style="--pill-color: {p.color}"
							onclick={() => togglePriority(p.id)}
						>
							{p.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-group">
				<span class="filter-label">Zeitraum</span>
				<div class="filter-pills">
					{#each DATE_RANGES as dr (dr.id)}
						<button
							class="filter-pill"
							class:active={config.filter.dateRange === dr.id}
							onclick={() => setDateRange(dr.id)}
						>
							{dr.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-group">
				<label class="completed-toggle">
					<input
						type="checkbox"
						checked={config.filter.completed ?? false}
						onchange={toggleCompleted}
					/>
					<span>Nur erledigte</span>
				</label>
			</div>
		</div>
	{/if}

	<div class="edit-row actions-row">
		<button class="action-btn delete-btn" onclick={onDelete} title="Seite löschen">
			<Trash size={14} />
		</button>
	</div>
</div>

<style>
	.edit-bar {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border));
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		animation: slideDown 0.2s ease-out;
	}
	@keyframes slideDown {
		from {
			opacity: 0;
			max-height: 0;
		}
		to {
			opacity: 1;
			max-height: 300px;
		}
	}
	.edit-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.icons-row {
		gap: 0.125rem;
		flex-wrap: wrap;
	}
	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.icon-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
	.icon-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		transition: color 0.15s;
	}
	.filter-toggle:hover {
		color: hsl(var(--color-foreground));
	}
	.filter-toggle-arrow {
		font-size: 0.625rem;
		transition: transform 0.2s;
	}
	.filter-toggle-arrow.open {
		transform: rotate(180deg);
	}
	.filter-section {
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}
	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.filter-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.filter-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.filter-pill {
		padding: 0.1875rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.filter-pill:hover {
		border-color: hsl(var(--color-border-strong));
		color: hsl(var(--color-foreground));
	}
	.filter-pill.active {
		background: var(--pill-color, hsl(var(--color-primary)));
		border-color: var(--pill-color, hsl(var(--color-primary)));
		color: hsl(var(--color-primary-foreground));
	}
	.completed-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.completed-toggle input {
		width: 14px;
		height: 14px;
		accent-color: hsl(var(--color-primary));
		cursor: pointer;
	}
	.actions-row {
		justify-content: flex-end;
	}
	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
	.delete-btn:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.08);
	}
</style>
