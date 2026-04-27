<!--
  ExercisePicker — searchable modal for picking an exercise inside the
  workout logger.

  Three things this gives the user that the previous <select> couldn't:
    1. Search by name (substring, case-insensitive)
    2. Filter by muscle group via tap-able chips
    3. Inline "last working set" hint per row — the highest-leverage
       UX win in the whole module: progressive overload becomes
       "look at the number, add 2.5kg".

  Also lets the user create a new exercise inline without leaving the
  picker. The new exercise is selected automatically so the parent
  doesn't need to round-trip back through the list.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { BodyExercise, BodySet, MuscleGroup } from '../types';
	import { MUSCLE_GROUPS } from '../types';
	import { getLastSetByExercise, relativeDays } from '../queries';
	import { bodyStore } from '../stores/body.svelte';

	interface Props {
		exercises: BodyExercise[];
		sets: BodySet[];
		onPick: (exerciseId: string) => void;
		onClose: () => void;
	}
	const { exercises, sets, onPick, onClose }: Props = $props();

	let query = $state('');
	let activeFilter = $state<MuscleGroup | 'all'>('all');
	let creating = $state(false);
	let newName = $state('');
	let newMuscle = $state<MuscleGroup>('chest');

	let lastSets = $derived(getLastSetByExercise(sets));

	let filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return exercises
			.filter((e) => !e.isArchived)
			.filter((e) => activeFilter === 'all' || e.muscleGroup === activeFilter)
			.filter((e) => q === '' || e.name.toLowerCase().includes(q))
			.sort((a, b) => {
				// Recently-used exercises bubble to the top — those with a
				// known last-set come first, ordered by recency.
				const la = lastSets.get(a.id);
				const lb = lastSets.get(b.id);
				if (la && lb) return lb.createdAt.localeCompare(la.createdAt);
				if (la) return -1;
				if (lb) return 1;
				return a.name.localeCompare(b.name);
			});
	});

	async function pick(id: string) {
		onPick(id);
		onClose();
	}

	async function createInline(e: Event) {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		const created = await bodyStore.createExercise({
			name,
			muscleGroup: newMuscle,
			equipment: 'barbell',
		});
		newName = '';
		creating = false;
		// Auto-select the new exercise so the user can immediately log a set
		// against it. The bodyExercises liveQuery will refresh the parent's
		// list shortly after this resolves; until then we just hand back
		// the id and trust the caller.
		onPick(created.id);
		onClose();
	}

	function backdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKey} />

<div
	class="backdrop"
	onclick={backdropClick}
	onkeydown={handleKey}
	role="dialog"
	aria-modal="true"
	aria-label={$_('body.exercisePicker.dialog_label')}
	tabindex="-1"
>
	<div class="sheet">
		<header>
			<h2>{$_('body.exercisePicker.title')}</h2>
			<button
				type="button"
				class="close"
				onclick={onClose}
				aria-label={$_('body.exercisePicker.close_aria')}>×</button
			>
		</header>

		<!-- svelte-ignore a11y_autofocus -->
		<input
			class="search"
			type="search"
			placeholder={$_('body.exercisePicker.search')}
			bind:value={query}
			autofocus
		/>

		<div class="filters">
			<button
				type="button"
				class="chip"
				class:active={activeFilter === 'all'}
				onclick={() => (activeFilter = 'all')}
			>
				{$_('body.exercisePicker.filter_all')}
			</button>
			{#each MUSCLE_GROUPS as g (g)}
				<button
					type="button"
					class="chip"
					class:active={activeFilter === g}
					onclick={() => (activeFilter = g)}
				>
					{$_(`body.muscle.${g}`, { default: g })}
				</button>
			{/each}
		</div>

		<div class="results">
			{#if filtered.length === 0}
				<p class="empty">
					{$_('body.exercisePicker.empty')}
				</p>
			{:else}
				<ul>
					{#each filtered as ex (ex.id)}
						{@const last = lastSets.get(ex.id)}
						<li>
							<button type="button" class="row" onclick={() => pick(ex.id)}>
								<div class="row-main">
									<div class="row-name">{ex.name}</div>
									<div class="row-meta">
										{$_(`body.muscle.${ex.muscleGroup}`, { default: ex.muscleGroup })}
										· {ex.equipment}
									</div>
								</div>
								{#if last}
									<div class="row-last">
										<div class="last-value">{last.weight}kg × {last.reps}</div>
										<div class="last-when">{relativeDays(last.createdAt)}</div>
									</div>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<footer>
			{#if creating}
				<form class="create-form" onsubmit={createInline}>
					<input
						type="text"
						placeholder={$_('body.exercisePicker.placeholder_name')}
						bind:value={newName}
						required
					/>
					<select bind:value={newMuscle}>
						{#each MUSCLE_GROUPS as g (g)}
							<option value={g}>{$_(`body.muscle.${g}`)}</option>
						{/each}
					</select>
					<button type="submit" class="primary">{$_('body.exercisePicker.action_create')}</button>
					<button type="button" onclick={() => (creating = false)}
						>{$_('body.exercisePicker.action_cancel')}</button
					>
				</form>
			{:else}
				<button type="button" class="add" onclick={() => (creating = true)}>
					+ {$_('body.exercisePicker.create')}
				</button>
			{/if}
		</footer>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 0;
	}
	@media (min-width: 640px) {
		.backdrop {
			align-items: center;
			padding: 1rem;
		}
	}
	.sheet {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 32rem;
		max-height: 90vh;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem 1rem 0 0;
		overflow: hidden;
	}
	@media (min-width: 640px) {
		.sheet {
			border-radius: 1rem;
		}
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	header h2 {
		font-size: 0.95rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.close {
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 1.5rem;
		cursor: pointer;
		border-radius: 0.375rem;
	}
	.close:hover {
		background: hsl(var(--color-muted));
	}
	.search {
		margin: 0.75rem 1rem 0;
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}
	.filters {
		display: flex;
		gap: 0.375rem;
		padding: 0.625rem 1rem 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.filters::-webkit-scrollbar {
		display: none;
	}
	.chip {
		padding: 0.3125rem 0.75rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		flex-shrink: 0;
	}
	.chip.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.results {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 1rem;
	}
	.results ul {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		text-align: left;
		cursor: pointer;
	}
	.row:hover {
		background: hsl(var(--color-muted));
		border-color: hsl(var(--color-border));
	}
	.row-main {
		min-width: 0;
		flex: 1;
	}
	.row-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.row-meta {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: capitalize;
		margin-top: 0.0625rem;
	}
	.row-last {
		text-align: right;
		flex-shrink: 0;
	}
	.last-value {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		font-variant-numeric: tabular-nums;
	}
	.last-when {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}
	.empty {
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		padding: 1.5rem 0;
	}
	footer {
		padding: 0.75rem 1rem;
		border-top: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
	}
	.add {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		border: 1px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.add:hover {
		color: hsl(var(--color-foreground));
		border-color: hsl(var(--color-foreground));
	}
	.create-form {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
	.create-form input {
		flex: 1 1 8rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}
	.create-form select {
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}
	.create-form button {
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.create-form button.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
</style>
