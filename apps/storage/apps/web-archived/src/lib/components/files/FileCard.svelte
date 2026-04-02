<script lang="ts">
	import type { StorageFile } from '$lib/api/client';
	import {
		File,
		FileImage,
		FileText,
		FileVideo,
		FileAudio,
		FileZip,
		Heart,
		DotsThreeVertical,
	} from '@manacore/shared-icons';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { filesStore } from '$lib/stores/files.svelte';

	interface Props {
		file: StorageFile;
		onClick?: () => void;
		onAction?: (action: string) => void;
	}

	let { file, onClick, onAction }: Props = $props();

	let isSelected = $derived(filesStore.selectedFileIds.has(file.id));
	let hasSelection = $derived(filesStore.selectionCount > 0);

	let contextMenuVisible = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);
	let isDragging = $state(false);

	function getFileIcon(mimeType: string) {
		if (mimeType.startsWith('image/')) return FileImage;
		if (mimeType.startsWith('video/')) return FileVideo;
		if (mimeType.startsWith('audio/')) return FileAudio;
		if (mimeType.startsWith('text/')) return FileText;
		if (mimeType.includes('zip') || mimeType.includes('archive')) return FileZip;
		return File;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		contextMenuVisible = true;
	}

	function handleMenuClick(e: MouseEvent) {
		e.stopPropagation();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		contextMenuX = rect.right;
		contextMenuY = rect.bottom;
		contextMenuVisible = true;
	}

	function getContextMenuItems(): ContextMenuItem[] {
		return [
			{ id: 'download', label: 'Herunterladen' },
			{ id: 'rename', label: 'Umbenennen' },
			{ id: 'share', label: 'Teilen' },
			{ id: 'favorite', label: file.isFavorite ? 'Favorit entfernen' : 'Als Favorit' },
			{ id: 'move', label: 'Verschieben' },
			{ id: 'divider', label: '', type: 'divider' },
			{ id: 'delete', label: 'Löschen', variant: 'danger' },
		];
	}

	function handleContextMenuSelect(item: ContextMenuItem) {
		onAction?.(item.id);
	}

	const Icon = getFileIcon(file.mimeType);
</script>

<div
	class="file-card"
	class:dragging={isDragging}
	class:selected={isSelected}
	onclick={(e) => {
		if (hasSelection) {
			e.stopPropagation();
			filesStore.toggleFileSelection(file.id);
		} else {
			onClick?.();
		}
	}}
	oncontextmenu={handleContextMenu}
	role="button"
	tabindex="0"
	draggable="true"
	ondragstart={(e) => {
		e.dataTransfer?.setData('application/json', JSON.stringify({ type: 'file', id: file.id }));
		e.dataTransfer!.effectAllowed = 'move';
		isDragging = true;
	}}
	ondragend={() => {
		isDragging = false;
	}}
>
	{#if hasSelection}
		<input
			type="checkbox"
			class="select-checkbox"
			checked={isSelected}
			onclick={(e) => {
				e.stopPropagation();
				filesStore.toggleFileSelection(file.id);
			}}
			aria-label="Datei auswählen"
		/>
	{/if}
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
	<button
		class="menu-button"
		onclick={handleMenuClick}
		type="button"
		aria-label="Aktionen für {file.name}"
		aria-haspopup="menu"
	>
		<DotsThreeVertical size={16} />
	</button>
</div>

<ContextMenu
	visible={contextMenuVisible}
	x={contextMenuX}
	y={contextMenuY}
	items={getContextMenuItems()}
	onClose={() => (contextMenuVisible = false)}
	onSelect={handleContextMenuSelect}
/>

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

	.file-card.selected {
		border-color: rgb(var(--color-primary));
		background: rgb(var(--color-primary) / 0.06);
	}

	.select-checkbox {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		width: 16px;
		height: 16px;
		accent-color: rgb(var(--color-primary));
		cursor: pointer;
	}

	.file-card.dragging {
		opacity: 0.5;
		transform: scale(0.95);
		border-style: dashed;
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
</style>
