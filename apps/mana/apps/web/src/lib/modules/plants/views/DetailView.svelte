<!--
  Plants — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
  Includes photo upload + AI plant identification.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { plantMutations, photoMutations } from '../mutations';
	import { plantTagOps } from '../stores/tags.svelte';
	import { useAllTags, getTagsForPlant } from '../queries';
	import type { IdentifyResult } from '../api';
	import type { ViewProps } from '$lib/app-registry';
	import type {
		LocalPlant,
		LocalPlantPhoto,
		LocalPlantTag,
		LocalWateringLog,
		HealthStatus,
		LightLevel,
	} from '../types';

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

	let uploading = $state(false);
	let identifying = $state(false);
	let identifyResult = $state<IdentifyResult | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

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

	const photosQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalPlantPhoto>('plantPhotos').toArray();
		return all
			.filter((p) => p.plantId === plantId && !p.deletedAt)
			.sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : 0));
	}, [] as LocalPlantPhoto[]);
	const photos = $derived(photosQuery.value);

	// Watering history — show the 5 most recent log entries for this plant.
	const wateringLogsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalWateringLog>('wateringLogs').toArray();
		return all
			.filter((l) => l.plantId === plantId && !l.deletedAt)
			.sort((a, b) => new Date(b.wateredAt).getTime() - new Date(a.wateredAt).getTime())
			.slice(0, 5);
	}, [] as LocalWateringLog[]);
	const wateringLogs = $derived(wateringLogsQuery.value);

	// Tags — global tag list + plant-specific junction.
	const allTags = useAllTags();
	const plantTagsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalPlantTag>('plantTags').toArray();
		return all.filter((t) => !t.deletedAt);
	}, [] as LocalPlantTag[]);
	const attachedTags = $derived(getTagsForPlant(allTags.value, plantTagsQuery.value, plantId));
	const availableTags = $derived(
		allTags.value.filter((t) => !attachedTags.some((at) => at.id === t.id))
	);
	let showTagPicker = $state(false);

	async function handleAddTag(tagId: string) {
		try {
			await plantTagOps.addTag(plantId, tagId);
			showTagPicker = false;
		} catch (err) {
			console.error('add tag failed:', err);
			toast.error($_('plants.errors.saveFailed'));
		}
	}

	async function handleRemoveTag(tagId: string) {
		try {
			await plantTagOps.removeTag(plantId, tagId);
		} catch (err) {
			console.error('remove tag failed:', err);
			toast.error($_('plants.errors.saveFailed'));
		}
	}

	function formatLogDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	async function saveField() {
		detail.blur();
		try {
			await plantMutations.update(plantId, {
				name: editName.trim() || detail.entity?.name || $_('plants.plant.unnamed'),
				scientificName: editScientificName.trim() || undefined,
				careNotes: editCareNotes.trim() || undefined,
				lightRequirements: editLightRequirements || undefined,
				wateringFrequencyDays: editWateringFrequencyDays ?? undefined,
			});
			// species, healthStatus, acquiredAt aren't on UpdatePlantDto — write
			// directly so they still flush through the same Dexie hook chain.
			await db.table('plants').update(plantId, {
				species: editSpecies.trim() || null,
				healthStatus: editHealthStatus,
				acquiredAt: editAcquiredAt ? new Date(editAcquiredAt).toISOString() : null,
				updatedAt: new Date().toISOString(),
			});
		} catch (err) {
			console.error('plant save failed:', err);
			toast.error($_('plants.errors.saveFailed'));
		}
	}

	async function handleSelectChange() {
		try {
			await db.table('plants').update(plantId, {
				healthStatus: editHealthStatus,
				lightRequirements: editLightRequirements || null,
				updatedAt: new Date().toISOString(),
			});
		} catch (err) {
			console.error('plant select save failed:', err);
			toast.error($_('plants.errors.saveFailed'));
		}
	}

	async function deletePlant() {
		await plantMutations.delete(plantId);
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			await photoMutations.upload(plantId, file);
			toast.success($_('plants.success.photoUploaded'));
		} catch (err) {
			console.error('photo upload failed:', err);
			toast.error($_('plants.errors.uploadFailed'));
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = '';
		}
	}

	async function handleIdentify() {
		const primary = photos[0];
		if (!primary) {
			toast.error($_('plants.errors.identifyFailed'));
			return;
		}
		identifying = true;
		identifyResult = null;
		try {
			const result = await photoMutations.identify(primary.id);
			identifyResult = result;
			toast.success($_('plants.success.identified'));
		} catch (err) {
			console.error('identify failed:', err);
			toast.error($_('plants.errors.identifyFailed'));
		} finally {
			identifying = false;
		}
	}

	async function applyIdentification() {
		if (!identifyResult) return;
		try {
			await plantMutations.applyIdentification(plantId, identifyResult, { overwrite: false });
			toast.success($_('plants.success.plantSaved'));
			identifyResult = null;
		} catch (err) {
			console.error('apply identification failed:', err);
			toast.error($_('plants.errors.saveFailed'));
		}
	}

	async function handleSetPrimary(photoId: string) {
		try {
			await photoMutations.setPrimary(plantId, photoId);
		} catch (err) {
			console.error('set primary failed:', err);
			toast.error($_('plants.errors.saveFailed'));
		}
	}

	async function handleRemovePhoto(photoId: string) {
		try {
			await photoMutations.remove(photoId);
		} catch (err) {
			console.error('remove photo failed:', err);
			toast.error($_('plants.errors.deleteFailed'));
		}
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel={$_('plants.plant.notFound')}
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel={$_('plants.plant.confirmDelete')}
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: $_('plants.success.plantDeleted'),
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
			placeholder={$_('plants.plant.namePlaceholder')}
		/>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">{$_('plants.plant.scientificName')}</span>
				<input
					class="prop-input"
					bind:value={editScientificName}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder={$_('plants.common.none')}
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('plants.plant.species')}</span>
				<input
					class="prop-input"
					bind:value={editSpecies}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder={$_('plants.common.none')}
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('plants.plant.state')}</span>
				<select
					class="prop-select health-{editHealthStatus}"
					bind:value={editHealthStatus}
					onchange={handleSelectChange}
				>
					<option value="healthy">{$_('plants.health.healthy')}</option>
					<option value="needs_attention">{$_('plants.health.needsAttention')}</option>
					<option value="sick">{$_('plants.health.sick')}</option>
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('plants.plant.light')}</span>
				<select
					class="prop-select"
					bind:value={editLightRequirements}
					onchange={handleSelectChange}
				>
					<option value="">{$_('plants.common.none')}</option>
					<option value="low">{$_('plants.light.low')}</option>
					<option value="medium">{$_('plants.light.medium')}</option>
					<option value="bright">{$_('plants.light.bright')}</option>
					<option value="direct">{$_('plants.light.direct')}</option>
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('plants.plant.wateringDays')}</span>
				<input
					type="number"
					class="prop-input"
					bind:value={editWateringFrequencyDays}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder={$_('plants.common.none')}
					min="1"
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('plants.plant.acquired')}</span>
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
			<span class="section-label">{$_('plants.plant.careNotes')}</span>
			<textarea
				class="description-input"
				bind:value={editCareNotes}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder={$_('plants.plant.notesPlaceholder')}
				rows={3}
			></textarea>
		</div>

		<div class="section">
			<div class="section-header">
				<span class="section-label">{$_('plants.photo.section')}</span>
				<div class="photo-actions">
					<button
						type="button"
						class="action-btn"
						onclick={() => fileInput?.click()}
						disabled={uploading}
					>
						{uploading ? $_('plants.photo.uploading') : $_('plants.photo.upload')}
					</button>
					{#if photos.length > 0}
						<button
							type="button"
							class="action-btn primary"
							onclick={handleIdentify}
							disabled={identifying}
						>
							{identifying ? $_('plants.identify.analyzing') : $_('plants.identify.button')}
						</button>
					{/if}
				</div>
			</div>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				class="hidden-input"
				onchange={handleFileSelect}
			/>

			{#if photos.length === 0}
				<p class="empty">{$_('plants.photo.noPhotos')}</p>
			{:else}
				<div class="photo-grid">
					{#each photos as photo (photo.id)}
						<div class="photo-tile" class:primary={photo.isPrimary}>
							<img src={photo.publicUrl ?? ''} alt={plant.name} />
							<div class="photo-overlay">
								{#if !photo.isPrimary}
									<button
										type="button"
										class="photo-btn"
										onclick={() => handleSetPrimary(photo.id)}
										title={$_('plants.photo.primary')}
									>
										★
									</button>
								{/if}
								<button
									type="button"
									class="photo-btn danger"
									onclick={() => handleRemovePhoto(photo.id)}
									title={$_('plants.common.delete')}
								>
									×
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if identifyResult}
				<div class="identify-result">
					<div class="identify-header">
						<span class="identify-title">{$_('plants.identify.resultTitle')}</span>
						<button type="button" class="action-btn primary" onclick={applyIdentification}>
							{$_('plants.identify.applyResult')}
						</button>
					</div>
					{#if identifyResult.scientificName}
						<p>
							<strong>{$_('plants.plant.scientificName')}:</strong>
							{identifyResult.scientificName}
						</p>
					{/if}
					{#if identifyResult.commonNames?.length}
						<p>{identifyResult.commonNames.join(', ')}</p>
					{/if}
					{#if identifyResult.confidence !== undefined}
						<p class="muted">
							{$_('plants.identify.confidence')}: {Math.round(identifyResult.confidence * 100)}%
						</p>
					{/if}
					{#if identifyResult.wateringAdvice}
						<p>{identifyResult.wateringAdvice}</p>
					{/if}
					{#if identifyResult.lightAdvice}
						<p>{identifyResult.lightAdvice}</p>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Tags -->
		<div class="section">
			<span class="section-label">Tags</span>
			<div class="tag-row">
				{#each attachedTags as tag (tag.id)}
					<span class="tag-chip" style="background-color: {tag.color || 'rgba(255,255,255,0.12)'}">
						{tag.name}
						<button
							type="button"
							class="tag-remove"
							onclick={() => handleRemoveTag(tag.id)}
							aria-label={$_('plants.common.delete')}
						>
							×
						</button>
					</span>
				{/each}
				<div class="tag-picker-wrap">
					<button type="button" class="tag-add" onclick={() => (showTagPicker = !showTagPicker)}>
						+ Tag
					</button>
					{#if showTagPicker && availableTags.length > 0}
						<div class="tag-picker" role="menu">
							{#each availableTags as tag (tag.id)}
								<button type="button" class="tag-picker-item" onclick={() => handleAddTag(tag.id)}>
									<span class="tag-dot" style="background-color: {tag.color || '#888'}"></span>
									{tag.name}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Watering history -->
		{#if wateringLogs.length > 0}
			<div class="section">
				<span class="section-label">{$_('plants.watering.lastWatered')}</span>
				<ul class="watering-history">
					{#each wateringLogs as log (log.id)}
						<li>
							<span class="watering-date">{formatLogDate(log.wateredAt)}</span>
							{#if log.notes}
								<span class="watering-notes">{log.notes}</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="meta">
			<span
				>{$_('plants.plant.created')}: {new Date(plant.createdAt ?? '').toLocaleDateString()}</span
			>
			{#if plant.updatedAt}
				<span>{$_('plants.plant.edited')}: {new Date(plant.updatedAt).toLocaleDateString()}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.health-healthy {
		color: rgb(34 197 94);
	}
	.health-needs_attention {
		color: rgb(245 158 11);
	}
	.health-sick {
		color: rgb(239 68 68);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.photo-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
	}
	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.action-btn.primary {
		background: rgba(59, 130, 246, 0.18);
		border-color: rgba(59, 130, 246, 0.35);
		color: rgb(147, 197, 253);
	}

	.hidden-input {
		display: none;
	}

	.empty {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.3);
		padding: 0.5rem 0;
	}

	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 0.5rem;
	}

	.photo-tile {
		position: relative;
		aspect-ratio: 1;
		border-radius: 0.375rem;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	.photo-tile.primary {
		border-color: rgba(59, 130, 246, 0.6);
	}
	.photo-tile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.photo-overlay {
		position: absolute;
		top: 2px;
		right: 2px;
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.15s;
	}
	.photo-tile:hover .photo-overlay {
		opacity: 1;
	}
	.photo-btn {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: none;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		font-size: 0.75rem;
		cursor: pointer;
	}
	.photo-btn.danger {
		background: rgba(239, 68, 68, 0.7);
	}

	.identify-result {
		margin-top: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(59, 130, 246, 0.25);
		background: rgba(59, 130, 246, 0.06);
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.8);
	}
	.identify-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	.identify-title {
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.5);
	}
	.identify-result p {
		margin: 0.25rem 0;
	}
	.identify-result .muted {
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.75rem;
	}

	/* Tags */
	.tag-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}
	.tag-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		color: white;
		font-weight: 500;
	}
	.tag-remove {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0;
		font-size: 0.875rem;
		line-height: 1;
		opacity: 0.7;
	}
	.tag-remove:hover {
		opacity: 1;
	}
	.tag-picker-wrap {
		position: relative;
	}
	.tag-add {
		background: transparent;
		border: 1px dashed rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.5);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.tag-add:hover {
		border-color: rgba(255, 255, 255, 0.4);
		color: rgba(255, 255, 255, 0.8);
	}
	.tag-picker {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		z-index: 20;
		min-width: 160px;
		max-height: 200px;
		overflow-y: auto;
		padding: 0.25rem;
		background: rgb(20, 20, 24);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.5rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}
	.tag-picker-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.75rem;
		text-align: left;
		cursor: pointer;
		border-radius: 0.25rem;
	}
	.tag-picker-item:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.tag-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	/* Watering history */
	.watering-history {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.watering-history li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		padding: 0.25rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}
	.watering-history li:last-child {
		border-bottom: none;
	}
	.watering-date {
		color: rgba(255, 255, 255, 0.85);
	}
	.watering-notes {
		font-style: italic;
		color: rgba(255, 255, 255, 0.4);
		text-align: right;
	}
</style>
