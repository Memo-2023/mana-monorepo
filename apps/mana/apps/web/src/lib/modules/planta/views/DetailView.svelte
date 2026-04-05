<!--
  Planta — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { toastStore } from '@mana/shared-ui/toast';
	import { Trash } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalPlant, HealthStatus, LightLevel } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let plantId = $derived(params.plantId as string);

	let plant = $state<LocalPlant | null>(null);
	let confirmDelete = $state(false);

	// Edit fields
	let editName = $state('');
	let editScientificName = $state('');
	let editSpecies = $state('');
	let editHealthStatus = $state<HealthStatus>('healthy');
	let editLightRequirements = $state<LightLevel | ''>('');
	let editWateringFrequencyDays = $state<number | null>(null);
	let editCareNotes = $state('');
	let editAcquiredAt = $state('');

	let focused = $state(false);

	$effect(() => {
		plantId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalPlant>('plants').get(plantId)).subscribe((val) => {
			plant = val ?? null;
			if (val && !focused) {
				editName = val.name;
				editScientificName = val.scientificName ?? '';
				editSpecies = val.species ?? '';
				editHealthStatus = val.healthStatus ?? 'healthy';
				editLightRequirements = val.lightRequirements ?? '';
				editWateringFrequencyDays = val.wateringFrequencyDays ?? null;
				editCareNotes = val.careNotes ?? '';
				editAcquiredAt = val.acquiredAt?.split('T')[0] ?? '';
			}
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await db.table('plants').update(plantId, {
			name: editName.trim() || plant?.name || 'Unbenannt',
			scientificName: editScientificName.trim() || null,
			species: editSpecies.trim() || null,
			healthStatus: editHealthStatus,
			lightRequirements: editLightRequirements || null,
			wateringFrequencyDays: editWateringFrequencyDays,
			careNotes: editCareNotes.trim() || null,
			acquiredAt: editAcquiredAt ? new Date(editAcquiredAt).toISOString() : null,
			updatedAt: new Date().toISOString(),
		});
	}

	async function handleSelectChange() {
		await db.table('plants').update(plantId, {
			healthStatus: editHealthStatus,
			lightRequirements: editLightRequirements || null,
			updatedAt: new Date().toISOString(),
		});
	}

	async function deletePlant() {
		const id = plantId;
		await db.table('plants').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		goBack();
		toastStore.undo('Pflanze gelöscht', () => {
			db.table('plants').update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
		});
	}

	const healthLabels: Record<HealthStatus, string> = {
		healthy: 'Gesund',
		needs_attention: 'Braucht Pflege',
		sick: 'Krank',
	};

	const lightLabels: Record<LightLevel, string> = {
		low: 'Wenig',
		medium: 'Mittel',
		bright: 'Hell',
		direct: 'Direkt',
	};

	const healthColors: Record<HealthStatus, string> = {
		healthy: '#22c55e',
		needs_attention: '#f59e0b',
		sick: '#ef4444',
	};
</script>

<div class="detail-view">
	{#if !plant}
		<p class="empty">Pflanze nicht gefunden</p>
	{:else}
		<!-- Title -->
		<input
			class="title-input"
			bind:value={editName}
			onfocus={() => (focused = true)}
			onblur={saveField}
			placeholder="Name..."
		/>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Wissenschaftlicher Name</span>
				<input
					class="prop-input"
					bind:value={editScientificName}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="—"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Art</span>
				<input
					class="prop-input"
					bind:value={editSpecies}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="—"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Zustand</span>
				<select
					class="prop-select"
					bind:value={editHealthStatus}
					onchange={handleSelectChange}
					style="color: {healthColors[editHealthStatus]}"
				>
					{#each ['healthy', 'needs_attention', 'sick'] as const as s}
						<option value={s}>{healthLabels[s]}</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">Licht</span>
				<select
					class="prop-select"
					bind:value={editLightRequirements}
					onchange={handleSelectChange}
				>
					<option value="">—</option>
					{#each ['low', 'medium', 'bright', 'direct'] as const as l}
						<option value={l}>{lightLabels[l]}</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">Giessen (Tage)</span>
				<input
					type="number"
					class="prop-input"
					bind:value={editWateringFrequencyDays}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="—"
					min="1"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Erworben</span>
				<input
					type="date"
					class="prop-input"
					bind:value={editAcquiredAt}
					onfocus={() => (focused = true)}
					onblur={saveField}
				/>
			</div>
		</div>

		<!-- Care Notes -->
		<div class="section">
			<span class="section-label">Pflegehinweise</span>
			<textarea
				class="description-input"
				bind:value={editCareNotes}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Pflegehinweise hinzufuegen..."
				rows={3}
			></textarea>
		</div>

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(plant.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if plant.updatedAt}
				<span>Bearbeitet: {new Date(plant.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Pflanze wirklich loeschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deletePlant}>Loeschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Loeschen
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
	.title-input {
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0;
	}
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.properties {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
	}
	.prop-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.prop-select,
	.prop-input {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
	}
	.prop-select:hover,
	.prop-input:hover,
	.prop-select:focus,
	.prop-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .prop-select,
	:global(.dark) .prop-input {
		color: #e5e7eb;
	}
	:global(.dark) .prop-select:hover,
	:global(.dark) .prop-input:hover,
	:global(.dark) .prop-select:focus,
	:global(.dark) .prop-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.description-input {
		font-size: 0.8125rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: transparent;
		color: #374151;
		padding: 0.5rem;
		outline: none;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	.description-input:hover,
	.description-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.description-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .description-input {
		color: #f3f4f6;
	}
	:global(.dark) .description-input:hover,
	:global(.dark) .description-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .description-input::placeholder {
		color: #4b5563;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .meta {
		border-color: rgba(255, 255, 255, 0.06);
	}
	.danger-zone {
		padding-top: 0.5rem;
	}
	.confirm-text {
		font-size: 0.8125rem;
		color: #ef4444;
		margin: 0 0 0.5rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	.action-btn.danger {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}
	.action-btn.danger-subtle {
		color: #ef4444;
		border-color: transparent;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}

	@media (max-width: 640px) {
		.detail-view {
			padding: 0.75rem;
		}
		.action-btn {
			min-height: 44px;
		}
		.prop-select,
		.prop-input {
			min-height: 44px;
		}
	}
</style>
