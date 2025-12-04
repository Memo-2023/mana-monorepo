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
		onClick?: () => void;
		onAction?: (action: string) => void;
	}

	let { file, onClick, onAction }: Props = $props();

	let showMenu = $state(false);

	function getFileIcon(mimeType: string) {
		if (mimeType.startsWith('image/')) return FileImage;
		if (mimeType.startsWith('video/')) return FileVideo;
		if (mimeType.startsWith('audio/')) return FileAudio;
		if (mimeType.startsWith('text/')) return FileText;
		if (mimeType.includes('zip') || mimeType.includes('archive')) return FileArchive;
		return File;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

<div class="file-card" onclick={onClick} role="button" tabindex="0">
	<div class="file-icon">
		<Icon size={40} strokeWidth={1.5} />
		{#if file.isFavorite}
			<div class="favorite-badge">
				<Heart size={12} fill="currentColor" />
			</div>
		{/if}
	</div>
	<div class="file-info">
		<span class="file-name" title={file.name}>{file.name}</span>
		<span class="file-size">{formatFileSize(file.size)}</span>
	</div>
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
</div>

<style>
	.file-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: center;
	}

	.file-card:hover {
		border-color: rgb(var(--color-primary));
		box-shadow: var(--shadow-md);
	}

	.file-icon {
		position: relative;
		color: rgb(var(--color-primary));
		margin-bottom: 0.75rem;
	}

	.favorite-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		color: rgb(var(--color-warning));
	}

	.file-info {
		width: 100%;
		overflow: hidden;
	}

	.file-name {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-size {
		display: block;
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
		margin-top: 0.25rem;
	}

	.menu-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		opacity: 0;
		transition: opacity var(--transition-fast);
	}

	.file-card:hover .menu-button {
		opacity: 1;
	}

	.menu-button:hover {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
	}

	.menu-dropdown {
		position: absolute;
		top: 2rem;
		right: 0.5rem;
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
</style>
