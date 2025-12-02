<script lang="ts">
	import type { StorageFile } from '$lib/api/client';
	import {
		File,
		FileImage,
		FileText,
		FileVideo,
		FileAudio,
		FileArchive,
		Heart,
		MoreVertical,
	} from 'lucide-svelte';

	interface Props {
		file: StorageFile;
		formatFileSize: (bytes: number) => string;
		formatDate: (dateStr: string) => string;
		onClick?: () => void;
		onAction?: (action: string) => void;
	}

	let { file, formatFileSize, formatDate, onClick, onAction }: Props = $props();

	let showMenu = $state(false);

	function getFileIcon(mimeType: string) {
		if (mimeType.startsWith('image/')) return FileImage;
		if (mimeType.startsWith('video/')) return FileVideo;
		if (mimeType.startsWith('audio/')) return FileAudio;
		if (mimeType.startsWith('text/')) return FileText;
		if (mimeType.includes('zip') || mimeType.includes('archive')) return FileArchive;
		return File;
	}

	function handleMenuClick(e: MouseEvent) {
		e.stopPropagation();
		showMenu = !showMenu;
	}

	function handleAction(action: string) {
		showMenu = false;
		onAction?.(action);
	}

	const Icon = getFileIcon(file.mimeType);
</script>

<button class="file-row" onclick={onClick} type="button">
	<span class="col-name">
		<span class="icon">
			<Icon size={20} strokeWidth={1.5} />
		</span>
		<span class="name" title={file.name}>{file.name}</span>
		{#if file.isFavorite}
			<Heart size={14} fill="currentColor" class="favorite-icon" />
		{/if}
	</span>
	<span class="col-size">{formatFileSize(file.size)}</span>
	<span class="col-date">{formatDate(file.updatedAt)}</span>
	<span class="col-actions">
		<button class="menu-button" onclick={handleMenuClick} type="button">
			<MoreVertical size={16} />
		</button>
		{#if showMenu}
			<div class="menu-dropdown">
				<button onclick={() => handleAction('download')}>Herunterladen</button>
				<button onclick={() => handleAction('rename')}>Umbenennen</button>
				<button onclick={() => handleAction('share')}>Teilen</button>
				<button onclick={() => handleAction('favorite')}>
					{file.isFavorite ? 'Favorit entfernen' : 'Als Favorit'}
				</button>
				<button onclick={() => handleAction('move')}>Verschieben</button>
				<hr />
				<button class="danger" onclick={() => handleAction('delete')}>Löschen</button>
			</div>
		{/if}
	</span>
</button>

<style>
	.file-row {
		display: grid;
		grid-template-columns: 1fr 100px 120px 50px;
		gap: 1rem;
		padding: 0.75rem 1rem;
		align-items: center;
		border-bottom: 1px solid rgb(var(--color-border));
		background: transparent;
		border-left: none;
		border-right: none;
		border-top: none;
		cursor: pointer;
		transition: background var(--transition-fast);
		width: 100%;
		text-align: left;
	}

	.file-row:hover {
		background: rgb(var(--color-surface));
	}

	.col-name {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.icon {
		flex-shrink: 0;
		color: rgb(var(--color-primary));
	}

	.name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
	}

	.col-name :global(.favorite-icon) {
		flex-shrink: 0;
		color: rgb(var(--color-warning));
	}

	.col-size,
	.col-date {
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
	}

	.col-actions {
		position: relative;
	}

	.menu-button {
		padding: 0.25rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
	}

	.menu-button:hover {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
	}

	.menu-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		min-width: 150px;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		z-index: 100;
		overflow: hidden;
	}

	.menu-dropdown button {
		display: block;
		width: 100%;
		padding: 0.5rem 0.75rem;
		text-align: left;
		background: none;
		border: none;
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
		cursor: pointer;
	}

	.menu-dropdown button:hover {
		background: rgb(var(--color-surface));
	}

	.menu-dropdown button.danger {
		color: rgb(var(--color-error));
	}

	.menu-dropdown hr {
		margin: 0.25rem 0;
		border: none;
		border-top: 1px solid rgb(var(--color-border));
	}

	@media (max-width: 640px) {
		.file-row {
			grid-template-columns: 1fr 50px;
		}

		.col-size,
		.col-date {
			display: none;
		}
	}
</style>
