<!--
  Automations — Workbench ListView
  Create and manage cross-module automation rules.
  "When X happens in App A, do Y in App B."
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { automationsStore } from './stores/automations.svelte';
	import { SOURCE_OPTIONS, ACTION_OPTIONS, CONDITION_OPS } from './types';
	import type { LocalAutomation } from './types';
	import type { ConditionOp } from '$lib/triggers/conditions';
	import type { ViewProps } from '$lib/app-registry';
	import { Trash } from '@manacore/shared-icons';

	let { navigate, goBack, params }: ViewProps = $props();

	// ─── Data ────────────────────────────────────────────────
	let automations = $state<LocalAutomation[]>([]);
	let habits = $state<{ id: string; title: string; emoji: string }[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalAutomation>('automations')
				.toArray()
				.then((all) => all.filter((a) => !a.deletedAt));
		}).subscribe((val) => {
			automations = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	// Load habits for the select dropdown
	$effect(() => {
		const sub = liveQuery(async () => {
			const all = await db.table('habits').toArray();
			return all
				.filter((h: Record<string, unknown>) => !h.deletedAt && !h.isArchived)
				.map((h: Record<string, unknown>) => ({
					id: h.id as string,
					title: h.title as string,
					emoji: h.emoji as string,
				}));
		}).subscribe((val) => {
			habits = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	// ─── Create Form ─────────────────────────────────────────
	let showCreate = $state(false);
	let newName = $state('');
	let newSourceKey = $state('');
	let newSourceOp = $state<'insert' | 'update'>('insert');
	let newConditionField = $state('');
	let newConditionOp = $state<ConditionOp>('contains');
	let newConditionValue = $state('');
	let newActionKey = $state('');
	let newParams = $state<Record<string, string>>({});

	let selectedSource = $derived(
		SOURCE_OPTIONS.find((s) => `${s.app}.${s.collection}` === newSourceKey)
	);
	let selectedAction = $derived(
		ACTION_OPTIONS.find((a) => `${a.app}.${a.action}` === newActionKey)
	);

	function resetForm() {
		newName = '';
		newSourceKey = '';
		newSourceOp = 'insert';
		newConditionField = '';
		newConditionOp = 'contains';
		newConditionValue = '';
		newActionKey = '';
		newParams = {};
		showCreate = false;
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!selectedSource || !selectedAction) return;

		const name = newName.trim() || `${selectedSource.appLabel} → ${selectedAction.appLabel}`;

		await automationsStore.create({
			name,
			sourceApp: selectedSource.app,
			sourceCollection: selectedSource.collection,
			sourceOp: newSourceOp,
			conditionField: newConditionField || undefined,
			conditionOp: newConditionField ? newConditionOp : undefined,
			conditionValue: newConditionField ? newConditionValue : undefined,
			targetApp: selectedAction.app,
			targetAction: selectedAction.action,
			targetParams: Object.keys(newParams).length > 0 ? newParams : undefined,
		});
		resetForm();
	}

	function sourceLabel(a: LocalAutomation): string {
		const src = SOURCE_OPTIONS.find(
			(s) => s.app === a.sourceApp && s.collection === a.sourceCollection
		);
		return src
			? `${src.appLabel} / ${src.collectionLabel}`
			: `${a.sourceApp}.${a.sourceCollection}`;
	}

	function actionLabel(a: LocalAutomation): string {
		const act = ACTION_OPTIONS.find((o) => o.app === a.targetApp && o.action === a.targetAction);
		return act ? `${act.appLabel}: ${act.actionLabel}` : `${a.targetApp}.${a.targetAction}`;
	}

	function conditionLabel(a: LocalAutomation): string {
		if (!a.conditionField) return 'immer';
		const opLabel = CONDITION_OPS.find((o) => o.value === a.conditionOp)?.label ?? a.conditionOp;
		return `${a.conditionField} ${opLabel} "${a.conditionValue}"`;
	}
</script>

<div class="automations-view">
	<!-- Header -->
	<div class="header">
		<span class="title">Automations</span>
		{#if !showCreate}
			<button class="add-btn" onclick={() => (showCreate = true)}>+ Neu</button>
		{/if}
	</div>

	<!-- Create Form -->
	{#if showCreate}
		<form class="create-form" onsubmit={handleCreate}>
			<input class="form-input" type="text" placeholder="Name (optional)" bind:value={newName} />

			<!-- WHEN -->
			<div class="form-section">
				<span class="form-label">WENN</span>
				<select class="form-select" bind:value={newSourceKey}>
					<option value="">App / Collection wählen...</option>
					{#each SOURCE_OPTIONS as src}
						<option value="{src.app}.{src.collection}"
							>{src.appLabel} / {src.collectionLabel}</option
						>
					{/each}
				</select>

				{#if selectedSource}
					<div class="form-row">
						<select class="form-select small" bind:value={newSourceOp}>
							<option value="insert">erstellt</option>
							<option value="update">geändert</option>
						</select>
					</div>
				{/if}
			</div>

			<!-- CONDITION -->
			{#if selectedSource}
				<div class="form-section">
					<span class="form-label">BEDINGUNG (optional)</span>
					<div class="form-row">
						<select class="form-select" bind:value={newConditionField}>
							<option value="">Kein Filter</option>
							{#each selectedSource.fields as field}
								<option value={field}>{field}</option>
							{/each}
						</select>
						{#if newConditionField}
							<select class="form-select small" bind:value={newConditionOp}>
								{#each CONDITION_OPS as op}
									<option value={op.value}>{op.label}</option>
								{/each}
							</select>
							<input
								class="form-input"
								type="text"
								placeholder="Wert..."
								bind:value={newConditionValue}
							/>
						{/if}
					</div>
				</div>
			{/if}

			<!-- THEN -->
			<div class="form-section">
				<span class="form-label">DANN</span>
				<select class="form-select" bind:value={newActionKey}>
					<option value="">Aktion wählen...</option>
					{#each ACTION_OPTIONS as act}
						<option value="{act.app}.{act.action}">{act.appLabel}: {act.actionLabel}</option>
					{/each}
				</select>

				{#if selectedAction}
					{#each selectedAction.params as param}
						<div class="form-row">
							<span class="param-label">{param.label}</span>
							{#if param.key === 'habitId'}
								<select
									class="form-select"
									value={newParams[param.key] ?? ''}
									onchange={(e) => {
										newParams = {
											...newParams,
											[param.key]: (e.target as HTMLSelectElement).value,
										};
									}}
								>
									<option value="">Habit wählen...</option>
									{#each habits as h}
										<option value={h.id}>{h.emoji} {h.title}</option>
									{/each}
								</select>
							{:else}
								<input
									class="form-input"
									type="text"
									placeholder={param.label}
									value={newParams[param.key] ?? ''}
									oninput={(e) => {
										newParams = { ...newParams, [param.key]: (e.target as HTMLInputElement).value };
									}}
								/>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			<!-- Actions -->
			<div class="form-actions">
				<button type="button" class="btn-cancel" onclick={resetForm}>Abbrechen</button>
				<button type="submit" class="btn-create" disabled={!selectedSource || !selectedAction}
					>Erstellen</button
				>
			</div>
		</form>
	{/if}

	<!-- Automation List -->
	<div class="list">
		{#each automations as auto (auto.id)}
			<div class="item" class:disabled={!auto.enabled}>
				<button
					class="toggle"
					class:active={auto.enabled}
					onclick={() => automationsStore.toggle(auto.id)}
				>
					<span class="toggle-dot"></span>
				</button>
				<div class="item-info">
					<span class="item-name">{auto.name}</span>
					<span class="item-rule">
						<span class="rule-when">{sourceLabel(auto)}</span>
						<span class="rule-arrow">→</span>
						<span class="rule-condition">{conditionLabel(auto)}</span>
						<span class="rule-arrow">→</span>
						<span class="rule-action">{actionLabel(auto)}</span>
					</span>
				</div>
				<button class="delete-btn" onclick={() => automationsStore.remove(auto.id)}>
					<Trash size={12} />
				</button>
			</div>
		{/each}
	</div>

	{#if automations.length === 0 && !showCreate}
		<div class="empty">
			<p>Keine Automations angelegt.</p>
			<p class="empty-hint">Erstelle Regeln die Module miteinander verbinden.</p>
			<button class="empty-add" onclick={() => (showCreate = true)}
				>Erste Automation erstellen</button
			>
		</div>
	{/if}
</div>

<style>
	.automations-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.add-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px dashed var(--color-border, rgba(255, 255, 255, 0.15));
		background: transparent;
		color: var(--color-muted-foreground);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-btn:hover {
		border-color: #8b5cf6;
		color: #8b5cf6;
	}

	/* ── Create Form ──────────────────────── */
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-label {
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #8b5cf6;
	}

	.form-row {
		display: flex;
		gap: 0.375rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.form-input,
	.form-select {
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: transparent;
		color: var(--color-foreground);
		font-size: 0.75rem;
		outline: none;
		flex: 1;
		min-width: 0;
	}
	.form-input:focus,
	.form-select:focus {
		border-color: #8b5cf6;
	}
	.form-input::placeholder {
		color: var(--color-muted-foreground);
	}
	.form-select.small {
		flex: 0 0 auto;
		width: auto;
	}

	.param-label {
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
		flex-shrink: 0;
		min-width: 3rem;
	}

	.form-actions {
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
		color: var(--color-muted-foreground);
	}
	.btn-cancel:hover {
		background: var(--color-muted, rgba(255, 255, 255, 0.08));
	}
	.btn-create {
		background: #8b5cf6;
		color: white;
	}
	.btn-create:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-create:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ── List ─────────────────────────────── */
	.list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		transition: background 0.15s;
	}
	.item:hover {
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
	}
	.item.disabled {
		opacity: 0.5;
	}

	.toggle {
		width: 28px;
		height: 16px;
		border-radius: 9999px;
		border: none;
		background: var(--color-border, rgba(255, 255, 255, 0.15));
		cursor: pointer;
		position: relative;
		flex-shrink: 0;
		transition: background 0.2s;
	}
	.toggle.active {
		background: #8b5cf6;
	}
	.toggle-dot {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 12px;
		height: 12px;
		border-radius: 9999px;
		background: white;
		transition: transform 0.2s;
	}
	.toggle.active .toggle-dot {
		transform: translateX(12px);
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.item-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-rule {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.625rem;
		color: var(--color-muted-foreground);
		flex-wrap: wrap;
	}

	.rule-when {
		color: #3b82f6;
	}
	.rule-condition {
		color: #f59e0b;
	}
	.rule-action {
		color: #22c55e;
	}
	.rule-arrow {
		opacity: 0.4;
	}

	.delete-btn {
		border: none;
		background: transparent;
		color: var(--color-muted-foreground);
		cursor: pointer;
		padding: 0.25rem;
		opacity: 0;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	.item:hover .delete-btn {
		opacity: 1;
	}
	.delete-btn:hover {
		color: #ef4444;
	}

	/* ── Empty ────────────────────────────── */
	.empty {
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.8125rem;
		padding: 2rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	.empty-hint {
		font-size: 0.75rem;
		opacity: 0.7;
	}
	.empty-add {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: #8b5cf6;
		color: white;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		margin-top: 0.25rem;
	}
	.empty-add:hover {
		filter: brightness(1.1);
	}
</style>
