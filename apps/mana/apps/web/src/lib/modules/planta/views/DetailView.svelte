<!--
  Planta — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { db } from '$lib/data/database';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalPlant, HealthStatus, LightLevel } from '../types';

	let { params, goBack }: ViewProps = $props();
	let plantId = $derived(params.plantId as string);

	let editName = $state('');
	let editScientificName = $state('');
	let editSpecies = $state('');
	let editHealthStatus = $state<HealthStatus>('healthy');
	let editLightRequirements = $state<LightLevel | ''>('');
	let editWateringFrequencyDays = $state<number | null>(null);
	let editCareNotes = $state('');
	let editAcquiredAt = $state('');

	const detail = useDetailEntity<LocalPlant>({
		id: () => plantId,
		table: 'plants',
		onLoad: (val) => {
			editName = val.name;
			editScientificName = val.scientificName ?? '';
			editSpecies = val.species ?? '';
			editHealthStatus = val.healthStatus ?? 'healthy';
			editLightRequirements = val.lightRequirements ?? '';
			editWateringFrequencyDays = val.wateringFrequencyDays ?? null;
			editCareNotes = val.careNotes ?? '';
			editAcquiredAt = val.acquiredAt?.split('T')[0] ?? '';
		},
	});

	async function saveField() {
		detail.blur();
		await db.table('plants').update(plantId, {
			name: editName.trim() || detail.entity?.name || 'Unbenannt',
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
		await db.table('plants').update(plantId, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
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

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Pflanze nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Pflanze wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Pflanze gelöscht',
			delete: deletePlant,
			goBack,
		})}
>
	{#snippet body(plant)}
		<input
			class="title-input"
			bind:value={editName}
			onfocus={detail.focus}
			onblur={saveField}
			placeholder="Name..."
		/>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Wissenschaftlicher Name</span>
				<input
					class="prop-input"
					bind:value={editScientificName}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="—"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Art</span>
				<input
					class="prop-input"
					bind:value={editSpecies}
					onfocus={detail.focus}
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
				<span class="prop-label">Gießen (Tage)</span>
				<input
					type="number"
					class="prop-input"
					bind:value={editWateringFrequencyDays}
					onfocus={detail.focus}
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
					onfocus={detail.focus}
					onblur={saveField}
				/>
			</div>
		</div>

		<div class="section">
			<span class="section-label">Pflegehinweise</span>
			<textarea
				class="description-input"
				bind:value={editCareNotes}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Pflegehinweise hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<div class="meta">
			<span>Erstellt: {new Date(plant.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if plant.updatedAt}
				<span>Bearbeitet: {new Date(plant.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>
