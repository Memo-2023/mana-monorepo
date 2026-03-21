<script lang="ts">
	import type { StorageFile, StorageFolder } from '$lib/api/client';
	import FileRow from './FileRow.svelte';
	import FolderRow from './FolderRow.svelte';

	interface Props {
		files: StorageFile[];
		folders: StorageFolder[];
		onFileClick?: (file: StorageFile) => void;
		onFolderClick?: (folder: StorageFolder) => void;
		onFileAction?: (action: string, file: StorageFile) => void;
		onFolderAction?: (action: string, folder: StorageFolder) => void;
	}

	let { files, folders, onFileClick, onFolderClick, onFileAction, onFolderAction }: Props =
		$props();

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}
</script>

<div class="file-list" role="table" aria-label="Dateien und Ordner">
	<div class="list-header" role="row">
		<span class="col-name" role="columnheader">Name</span>
		<span class="col-size" role="columnheader">Größe</span>
		<span class="col-date" role="columnheader">Geändert</span>
		<span class="col-actions" role="columnheader"><span class="sr-only">Aktionen</span></span>
	</div>
	<div class="list-body" role="rowgroup">
		{#each folders as folder (folder.id)}
			<FolderRow
				{folder}
				{formatDate}
				onClick={() => onFolderClick?.(folder)}
				onAction={(action) => onFolderAction?.(action, folder)}
			/>
		{/each}
		{#each files as file (file.id)}
			<FileRow
				{file}
				{formatFileSize}
				{formatDate}
				onClick={() => onFileClick?.(file)}
				onAction={(action) => onFileAction?.(action, file)}
			/>
		{/each}
	</div>
</div>

<style>
	.file-list {
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.list-header {
		display: grid;
		grid-template-columns: 1fr 100px 120px 50px;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: rgb(var(--color-surface));
		border-bottom: 1px solid rgb(var(--color-border));
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: rgb(var(--color-text-secondary));
	}

	.list-body {
		background: rgb(var(--color-surface-elevated));
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	@media (max-width: 640px) {
		.list-header {
			grid-template-columns: 1fr 50px;
		}

		.col-size,
		.col-date {
			display: none;
		}
	}
</style>
