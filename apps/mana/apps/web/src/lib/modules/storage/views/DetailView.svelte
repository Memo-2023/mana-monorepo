<!--
  Storage — DetailView (inline editable overlay)
  File details with editable name, favorite toggle. Auto-save on blur.
-->
<script lang="ts">
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { filesStore } from '../stores/files.svelte';
	import { Heart } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalFile } from '../types';

	let { params, goBack }: ViewProps = $props();
	let fileId = $derived(params.fileId as string);

	let editName = $state('');

	const detail = useDetailEntity<LocalFile>({
		id: () => fileId,
		table: 'files',
		decrypt: true,
		onLoad: (val) => {
			editName = val.name;
		},
	});

	async function saveField() {
		detail.blur();
		const name = editName.trim() || detail.entity?.name || 'Unbenannt';
		await filesStore.renameFile(fileId, name);
	}

	async function toggleFavorite() {
		await filesStore.toggleFileFavorite(fileId);
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
		return (bytes / 1073741824).toFixed(1) + ' GB';
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Datei nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Datei gelöscht',
			delete: () => filesStore.deleteFile(fileId),
			goBack,
		})}
>
	{#snippet body(file)}
		<input
			class="title-input"
			bind:value={editName}
			onfocus={detail.focus}
			onblur={saveField}
			placeholder="Dateiname..."
		/>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Originalname</span>
				<span class="prop-value">{file.originalName}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Typ</span>
				<span class="prop-value">{file.mimeType}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Größe</span>
				<span class="prop-value">{formatSize(file.size)}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Favorit</span>
				<button class="fav-btn" class:active={file.isFavorite} onclick={toggleFavorite}>
					<Heart size={16} weight={file.isFavorite ? 'fill' : 'regular'} />
				</button>
			</div>

			{#if file.checksum}
				<div class="prop-row">
					<span class="prop-label">Prüfsumme</span>
					<span class="prop-value mono">{file.checksum.slice(0, 16)}...</span>
				</div>
			{/if}
		</div>

		<div class="meta">
			<span>Erstellt: {new Date(file.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if file.updatedAt}
				<span>Bearbeitet: {new Date(file.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>
