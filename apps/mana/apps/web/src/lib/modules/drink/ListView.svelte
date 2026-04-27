<!--
  Drink — ListView
  Quick-tap presets, daily progress bar, and today's log.
-->
<script lang="ts">
	import {
		useAllDrinkEntries,
		useAllDrinkPresets,
		getActivePresets,
		getEntriesForDate,
		getTotalMlForDate,
		todayStr,
		formatMl,
	} from './queries';
	import { drinkStore } from './stores/drink.svelte';
	import {
		DRINK_TYPE_LABELS,
		DRINK_TYPE_COLORS,
		DEFAULT_DAILY_GOAL_ML,
		type DrinkType,
	} from './types';
	import type { DrinkEntry, DrinkPreset } from './types';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { DynamicIcon } from '@mana/shared-ui/atoms';
	import { IconPicker } from '@mana/shared-ui/molecules';
	import { Trash, Pause, Play } from '@mana/shared-icons';
	import { _ } from 'svelte-i18n';

	let entries$ = useAllDrinkEntries();
	let presets$ = useAllDrinkPresets();
	let entries = $derived(entries$.value);
	let presets = $derived(presets$.value);

	let today = todayStr();
	let activePresets = $derived(getActivePresets(presets));
	let todayEntries = $derived(getEntriesForDate(entries, today));
	let todayTotalMl = $derived(getTotalMlForDate(entries, today));
	let goalProgress = $derived(Math.min(todayTotalMl / DEFAULT_DAILY_GOAL_ML, 1));
	let goalReached = $derived(todayTotalMl >= DEFAULT_DAILY_GOAL_ML);

	let animatingId = $state<string | null>(null);
	let editingId = $state<string | null>(null);
	let editQty = $state(0);
	let editDate = $state('');
	let editTime = $state('');
	let showCreate = $state(false);
	let newName = $state('');
	let newDrinkType = $state<DrinkType>('water');
	let newQuantityMl = $state(250);
	let newIcon = $state('drop');
	let newColor = $state('#3b82f6');
	let showIconPicker = $state(false);

	const QUICK_QUANTITIES = [150, 200, 250, 330, 500];

	async function handlePresetTap(preset: DrinkPreset) {
		await drinkStore.logFromPreset(preset.id);
		animatingId = preset.id;
		setTimeout(() => (animatingId = null), 300);
	}

	async function handleCreatePreset(e: Event) {
		e.preventDefault();
		if (!newName.trim()) return;
		await drinkStore.createPreset({
			name: newName.trim(),
			icon: newIcon,
			color: newColor,
			drinkType: newDrinkType,
			defaultQuantityMl: newQuantityMl,
		});
		newName = '';
		newIcon = 'drop';
		newColor = '#3b82f6';
		newDrinkType = 'water';
		newQuantityMl = 250;
		showCreate = false;
		showIconPicker = false;
	}

	const ctxMenuPreset = useItemContextMenu<DrinkPreset>();
	let ctxMenuPresetItems = $derived<ContextMenuItem[]>(
		ctxMenuPreset.state.target
			? [
					{
						id: 'archive',
						label: ctxMenuPreset.state.target.isArchived
							? $_('drink.list_view.ctx_activate')
							: $_('drink.list_view.ctx_archive'),
						icon: ctxMenuPreset.state.target.isArchived ? Play : Pause,
						action: () => {
							const target = ctxMenuPreset.state.target;
							if (target) drinkStore.updatePreset(target.id, { isArchived: !target.isArchived });
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: $_('drink.list_view.ctx_delete'),
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenuPreset.state.target;
							if (target) drinkStore.deletePreset(target.id);
						},
					},
				]
			: []
	);

	const ctxMenuEntry = useItemContextMenu<DrinkEntry>();
	let ctxMenuEntryItems = $derived<ContextMenuItem[]>(
		ctxMenuEntry.state.target
			? [
					{
						id: 'delete',
						label: $_('drink.list_view.ctx_delete'),
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenuEntry.state.target;
							if (target) drinkStore.deleteEntry(target.id);
						},
					},
				]
			: []
	);

	function startEdit(entry: DrinkEntry) {
		editingId = entry.id;
		editQty = entry.quantityMl;
		editDate = entry.date;
		editTime = entry.time;
	}

	async function saveEdit() {
		if (!editingId) return;
		await drinkStore.updateEntry(editingId, {
			quantityMl: editQty,
			date: editDate,
			time: editTime,
		});
		editingId = null;
	}

	function cancelEdit() {
		editingId = null;
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveEdit();
		}
		if (e.key === 'Escape') {
			cancelEdit();
		}
	}

	function handleCreateKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleCreatePreset(e);
		}
		if (e.key === 'Escape') {
			showCreate = false;
			showIconPicker = false;
		}
	}
</script>

<div class="drink-view">
	<!-- Daily Progress -->
	<div class="progress-section">
		<div class="progress-header">
			<span class="progress-label">{$_('drink.list_view.section_today')}</span>
			<span class="progress-value" class:goal-reached={goalReached}>
				{formatMl(todayTotalMl)}
				<span class="progress-goal">/ {formatMl(DEFAULT_DAILY_GOAL_ML)}</span>
			</span>
		</div>
		<div class="progress-bar">
			<div
				class="progress-fill"
				class:goal-reached={goalReached}
				style:width="{goalProgress * 100}%"
			></div>
		</div>
	</div>

	<!-- Preset Grid (quick-tap) -->
	<div class="preset-grid">
		{#each activePresets as preset (preset.id)}
			<button
				class="preset-item"
				class:pulse={animatingId === preset.id}
				onclick={() => handlePresetTap(preset)}
				oncontextmenu={(e) => ctxMenuPreset.open(e, preset)}
			>
				<span class="preset-icon" style:color={preset.color}>
					<DynamicIcon name={preset.icon} size={20} weight="bold" />
				</span>
				<span class="preset-qty">{formatMl(preset.defaultQuantityMl)}</span>
				<span class="preset-name">{preset.name}</span>
			</button>
		{/each}

		{#if !showCreate}
			<button class="preset-item add-btn" onclick={() => (showCreate = true)}>
				<span class="add-icon">+</span>
				<span class="preset-name">{$_('drink.list_view.action_new')}</span>
			</button>
		{/if}
	</div>

	<!-- Inline Create Form -->
	{#if showCreate}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<form class="create-form" onsubmit={handleCreatePreset} onkeydown={handleCreateKeydown}>
			<div class="create-row">
				<button
					type="button"
					class="icon-btn"
					style:background={newColor}
					onclick={() => (showIconPicker = !showIconPicker)}
				>
					<DynamicIcon name={newIcon} size={16} weight="bold" class="text-white" />
				</button>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="create-input"
					type="text"
					placeholder={$_('drink.list_view.placeholder_name')}
					bind:value={newName}
					autofocus
				/>
			</div>
			{#if showIconPicker}
				<div class="icon-picker-wrapper">
					<IconPicker
						selectedIcon={newIcon}
						onIconChange={(i) => {
							newIcon = i;
							showIconPicker = false;
						}}
						size="sm"
					/>
				</div>
			{/if}
			<div class="create-meta">
				<select class="meta-select" bind:value={newDrinkType}>
					{#each Object.entries(DRINK_TYPE_LABELS) as [key, label]}
						<option value={key}>{label.de}</option>
					{/each}
				</select>
				<div class="qty-row">
					{#each QUICK_QUANTITIES as q}
						<button
							type="button"
							class="qty-chip"
							class:selected={newQuantityMl === q}
							onclick={() => (newQuantityMl = q)}
						>
							{q} ml
						</button>
					{/each}
				</div>
			</div>
			<div class="create-actions">
				<button
					type="button"
					class="btn-cancel"
					onclick={() => {
						showCreate = false;
						showIconPicker = false;
					}}>{$_('drink.list_view.action_cancel')}</button
				>
				<button type="submit" class="btn-create" disabled={!newName.trim()}
					>{$_('drink.list_view.action_create')}</button
				>
			</div>
		</form>
	{/if}

	<!-- Today's Log -->
	{#if todayEntries.length > 0}
		<div class="today-log">
			<div class="log-label">{$_('drink.list_view.section_log')}</div>
			{#each todayEntries as entry (entry.id)}
				{#if editingId === entry.id}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="log-row editing" onkeydown={handleEditKeydown}>
						<span class="log-dot" style:background={DRINK_TYPE_COLORS[entry.drinkType]}></span>
						<span class="log-name">{entry.name}</span>
						<input class="edit-qty" type="number" min="1" step="10" bind:value={editQty} />
						<span class="edit-unit">ml</span>
						<input class="edit-date" type="date" bind:value={editDate} />
						<input class="edit-time" type="time" bind:value={editTime} />
						<button class="edit-save" onclick={saveEdit}>OK</button>
						<button class="edit-cancel" onclick={cancelEdit}>×</button>
					</div>
				{:else}
					<button
						class="log-row"
						onclick={() => startEdit(entry)}
						oncontextmenu={(e) => ctxMenuEntry.open(e, entry)}
					>
						<span class="log-dot" style:background={DRINK_TYPE_COLORS[entry.drinkType]}></span>
						<span class="log-name">{entry.name}</span>
						<span class="log-qty">{formatMl(entry.quantityMl)}</span>
						<span class="log-time">{entry.time}</span>
					</button>
				{/if}
			{/each}
		</div>
	{/if}

	<ContextMenu
		visible={ctxMenuPreset.state.visible}
		x={ctxMenuPreset.state.x}
		y={ctxMenuPreset.state.y}
		items={ctxMenuPresetItems}
		onClose={ctxMenuPreset.close}
	/>
	<ContextMenu
		visible={ctxMenuEntry.state.visible}
		x={ctxMenuEntry.state.x}
		y={ctxMenuEntry.state.y}
		items={ctxMenuEntryItems}
		onClose={ctxMenuEntry.close}
	/>

	{#if activePresets.length === 0 && !showCreate}
		<div class="empty">
			<p>{$_('drink.list_view.empty_title')}</p>
			<button class="empty-add-btn" onclick={() => (showCreate = true)}
				>{$_('drink.list_view.empty_action')}</button
			>
		</div>
	{/if}
</div>

<style>
	.drink-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	/* ── Progress ─────────────────────────────────── */
	.progress-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.progress-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.progress-value {
		font-size: 1.125rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	.progress-value.goal-reached {
		color: #22c55e;
	}

	.progress-goal {
		font-size: 0.75rem;
		font-weight: 400;
		opacity: 0.6;
	}

	.progress-bar {
		height: 6px;
		border-radius: 3px;
		background: hsl(var(--color-border));
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 3px;
		background: #3b82f6;
		transition: width 0.4s ease-out;
	}

	.progress-fill.goal-reached {
		background: #22c55e;
	}

	/* ── Preset Grid ──────────────────────────────── */
	.preset-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 0.5rem;
	}

	.preset-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.5rem 0.25rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
		user-select: none;
		touch-action: manipulation;
		color: hsl(var(--color-foreground));
	}

	.preset-item:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.preset-item:active {
		transform: scale(0.95);
	}

	.preset-item.pulse {
		animation: tap-pulse 300ms ease-out;
	}

	.preset-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.preset-qty {
		font-size: 0.6875rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-muted-foreground));
	}

	.preset-name {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		max-width: 100%;
	}

	.add-btn {
		border: 2px dashed hsl(var(--color-border));
		background: transparent;
	}
	.add-btn:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.add-icon {
		font-size: 1.25rem;
		font-weight: 300;
		line-height: 1;
		color: hsl(var(--color-muted-foreground));
	}
	.add-btn:hover .add-icon {
		color: hsl(var(--color-primary));
	}

	/* ── Today's Log ──────────────────────────────── */
	.today-log {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.log-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem 0;
	}

	.log-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		background: transparent;
		border: none;
		cursor: context-menu;
		width: 100%;
		text-align: left;
		color: hsl(var(--color-foreground));
	}

	.log-row:hover {
		background: hsl(var(--color-muted));
	}

	.log-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.log-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.log-qty {
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
		flex-shrink: 0;
	}

	.log-time {
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	/* ── Inline Edit ─────────────────────────────── */
	.log-row.editing {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-primary) / 0.3);
	}

	.edit-qty {
		width: 3.5rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.edit-qty:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	.edit-unit {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.edit-date,
	.edit-time {
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}
	.edit-date:focus,
	.edit-time:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	.edit-date {
		width: 8rem;
	}

	.edit-time {
		width: 5rem;
	}

	.edit-save {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		flex-shrink: 0;
	}
	.edit-save:hover {
		filter: brightness(1.1);
	}

	.edit-cancel {
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: none;
		font-size: 0.875rem;
		cursor: pointer;
		flex-shrink: 0;
		line-height: 1;
	}
	.edit-cancel:hover {
		color: hsl(var(--color-foreground));
	}

	/* ── Create Form ──────────────────────────────── */
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.create-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.icon-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.icon-btn:hover {
		transform: scale(1.1);
	}

	.icon-picker-wrapper {
		max-height: 14rem;
		overflow-y: auto;
		border-radius: 0.5rem;
		padding: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.create-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 2px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		padding: 0.375rem 0;
		outline: none;
	}
	.create-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.create-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.create-meta {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.meta-select {
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}

	.qty-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.qty-chip {
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.6875rem;
		font-weight: 500;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.qty-chip.selected {
		background: hsl(var(--color-primary));
		color: white;
		border-color: hsl(var(--color-primary));
	}
	.qty-chip:hover:not(.selected) {
		background: hsl(var(--color-muted));
	}

	.create-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}

	.btn-cancel,
	.btn-create {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}

	.btn-cancel {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.btn-cancel:hover {
		background: hsl(var(--color-muted));
	}

	.btn-create {
		background: hsl(var(--color-primary));
		color: white;
	}
	.btn-create:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-create:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ── Empty ────────────────────────────────────── */
	.empty {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		padding: 2rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.empty-add-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: filter 0.15s;
	}
	.empty-add-btn:hover {
		filter: brightness(1.1);
	}

	@keyframes tap-pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
		}
		100% {
			box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
		}
	}

	@media (max-width: 640px) {
		.drink-view {
			padding: 0.5rem;
		}
		.preset-item {
			padding: 0.625rem 0.375rem;
			min-height: 44px;
		}
	}
</style>
