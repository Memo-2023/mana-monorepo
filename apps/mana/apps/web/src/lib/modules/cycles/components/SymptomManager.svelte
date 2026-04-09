<!--
  Symptom Manager — Modal to create, rename, recolor, and delete cycle symptoms.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useAllSymptoms } from '../queries';
	import { symptomsStore } from '../stores/symptoms.svelte';
	import type { CycleSymptom, SymptomCategory } from '../types';
	import { Modal } from '@mana/shared-ui';

	interface Props {
		visible: boolean;
		onClose: () => void;
	}

	const { visible, onClose }: Props = $props();

	const symptoms$ = useAllSymptoms();
	const symptoms = $derived(symptoms$.value);

	const CATEGORIES: SymptomCategory[] = ['physical', 'emotional', 'other'];

	let newName = $state('');
	let newCategory = $state<SymptomCategory>('physical');
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editCategory = $state<SymptomCategory>('physical');

	async function handleCreate(e: Event) {
		e.preventDefault();
		const trimmed = newName.trim();
		if (!trimmed) return;
		await symptomsStore.createSymptom({ name: trimmed, category: newCategory });
		newName = '';
		newCategory = 'physical';
	}

	function startEdit(sym: CycleSymptom) {
		editingId = sym.id;
		editName = sym.name;
		editCategory = sym.category;
	}

	async function saveEdit() {
		if (!editingId) return;
		const trimmed = editName.trim();
		if (!trimmed) {
			editingId = null;
			return;
		}
		await symptomsStore.updateSymptom(editingId, { name: trimmed, category: editCategory });
		editingId = null;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function handleDelete(sym: CycleSymptom) {
		const ok = confirm(
			$_('cycles.confirm.deleteSymptom', { values: { name: sym.name } }) || `"${sym.name}" löschen?`
		);
		if (!ok) return;
		await symptomsStore.deleteSymptom(sym.id);
	}
</script>

<Modal {visible} {onClose} title={$_('cycles.symptomManager.title')} maxWidth="md">
	<div class="sm-content">
		<!-- Create form -->
		<form class="sm-create" onsubmit={handleCreate}>
			<input
				class="sm-input"
				type="text"
				placeholder={$_('cycles.symptomManager.newNamePlaceholder')}
				bind:value={newName}
			/>
			<select class="sm-select" bind:value={newCategory}>
				{#each CATEGORIES as cat}
					<option value={cat}>{$_(`cycles.symptomCategory.${cat}`)}</option>
				{/each}
			</select>
			<button class="sm-add" type="submit" disabled={!newName.trim()}>
				{$_('cycles.symptomManager.add')}
			</button>
		</form>

		<!-- Symptom list -->
		{#if symptoms.length === 0}
			<p class="sm-empty">{$_('cycles.symptomManager.empty')}</p>
		{:else}
			<ul class="sm-list">
				{#each symptoms as sym (sym.id)}
					<li class="sm-row" class:editing={editingId === sym.id}>
						{#if editingId === sym.id}
							<input
								class="sm-input"
								type="text"
								bind:value={editName}
								onkeydown={(e) => e.key === 'Enter' && saveEdit()}
							/>
							<select class="sm-select" bind:value={editCategory}>
								{#each CATEGORIES as cat}
									<option value={cat}>{$_(`cycles.symptomCategory.${cat}`)}</option>
								{/each}
							</select>
							<div class="sm-actions">
								<button class="sm-btn primary" type="button" onclick={saveEdit}>
									{$_('cycles.symptomManager.save')}
								</button>
								<button class="sm-btn" type="button" onclick={cancelEdit}>
									{$_('cycles.symptomManager.cancel')}
								</button>
							</div>
						{:else}
							<span
								class="sm-dot"
								style="background: {sym.color ?? 'var(--color-muted-foreground, #9ca3af)'}"
							></span>
							<div class="sm-info">
								<span class="sm-name">{sym.name}</span>
								<span class="sm-cat">
									{$_(`cycles.symptomCategory.${sym.category}`)}
									{#if sym.count > 0}
										· {sym.count}
									{/if}
								</span>
							</div>
							<div class="sm-actions">
								<button class="sm-btn" type="button" onclick={() => startEdit(sym)}>
									{$_('cycles.symptomManager.edit')}
								</button>
								<button class="sm-btn danger" type="button" onclick={() => handleDelete(sym)}>
									{$_('cycles.symptomManager.delete')}
								</button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</Modal>

<style>
	.sm-content {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 0.25rem 0;
	}

	.sm-create {
		display: flex;
		gap: 0.375rem;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.sm-input {
		flex: 1;
		min-width: 0;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		outline: none;
		font-family: inherit;
	}
	.sm-input:focus {
		border-color: #ec4899;
	}
	.sm-select {
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		font-family: inherit;
	}
	.sm-add {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: #ec4899;
		color: hsl(var(--color-primary-foreground));
		border: none;
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		transition: filter 0.15s;
	}
	.sm-add:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.sm-add:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.sm-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		max-height: 22rem;
		overflow-y: auto;
	}

	.sm-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.sm-row.editing {
		background: rgba(236, 72, 153, 0.06);
		border-radius: 0.375rem;
		padding: 0.5rem;
	}

	.sm-dot {
		width: 10px;
		height: 10px;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.sm-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.sm-name {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		font-weight: 500;
	}
	.sm-cat {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}

	.sm-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.sm-btn {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.sm-btn:hover {
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-surface-hover));
	}
	.sm-btn.primary {
		background: #ec4899;
		color: hsl(var(--color-primary-foreground));
		border-color: #ec4899;
	}
	.sm-btn.primary:hover {
		filter: brightness(1.1);
		background: #ec4899;
	}
	.sm-btn.danger:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.08);
		border-color: hsl(var(--color-error) / 0.3);
	}

	.sm-empty {
		padding: 2rem 0;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
	}
</style>
