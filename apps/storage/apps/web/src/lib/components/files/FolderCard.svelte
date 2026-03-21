<script lang="ts">
	import type { StorageFolder } from '$lib/api/client';
	import { Folder, Heart, DotsThreeVertical } from '@manacore/shared-icons';

	interface Props {
		folder: StorageFolder;
		onClick?: () => void;
		onAction?: (action: string) => void;
		onDrop?: (data: { type: 'file' | 'folder'; id: string }) => void;
	}

	let { folder, onClick, onAction, onDrop }: Props = $props();

	let showMenu = $state(false);
	let isDragOver = $state(false);

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		isDragOver = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragOver = false;
		const raw = e.dataTransfer?.getData('application/json');
		if (raw) {
			try {
				const data = JSON.parse(raw);
				if (data.id !== folder.id) {
					onDrop?.(data);
				}
			} catch {}
		}
	}

	function handleMenuClick(e: MouseEvent) {
		e.stopPropagation();
		showMenu = !showMenu;
	}

	function handleAction(action: string) {
		showMenu = false;
		onAction?.(action);
	}

	// Color mapping for folder colors
	const colorMap: Record<string, string> = {
		blue: '#3b82f6',
		green: '#22c55e',
		yellow: '#eab308',
		red: '#ef4444',
		purple: '#a855f7',
		pink: '#ec4899',
		orange: '#f97316',
		teal: '#14b8a6',
	};

	let folderColor = $derived(folder.color ? colorMap[folder.color] || folder.color : undefined);
</script>

<div
	class="folder-card"
	class:drag-over={isDragOver}
	onclick={onClick}
	role="button"
	tabindex="0"
	draggable="true"
	ondragstart={(e) => {
		e.dataTransfer?.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id }));
		e.dataTransfer!.effectAllowed = 'move';
	}}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<div class="folder-icon" style:color={folderColor}>
		<Folder size={40} strokeWidth={1.5} fill="currentColor" />
		{#if folder.isFavorite}
			<div class="favorite-badge">
				<Heart size={12} fill="currentColor" />
			</div>
		{/if}
	</div>
	<div class="folder-info">
		<span class="folder-name" title={folder.name}>{folder.name}</span>
	</div>
	<button
		class="menu-button"
		onclick={handleMenuClick}
		type="button"
		aria-label="Aktionen für {folder.name}"
		aria-expanded={showMenu}
		aria-haspopup="menu"
	>
		<DotsThreeVertical size={16} />
	</button>

	{#if showMenu}
		<div class="menu-dropdown" role="menu" aria-label="Ordneraktionen">
			<button role="menuitem" onclick={() => handleAction('rename')}>Umbenennen</button>
			<button role="menuitem" onclick={() => handleAction('share')}>Teilen</button>
			<button role="menuitem" onclick={() => handleAction('favorite')}>
				{folder.isFavorite ? 'Favorit entfernen' : 'Als Favorit'}
			</button>
			<button role="menuitem" onclick={() => handleAction('move')}>Verschieben</button>
			<hr />
			<button role="menuitem" class="danger" onclick={() => handleAction('delete')}>Löschen</button>
		</div>
	{/if}
</div>

<style>
	.folder-card {
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

	.folder-card:hover {
		border-color: rgb(var(--color-primary));
		box-shadow: var(--shadow-md);
	}

	.folder-card.drag-over {
		border-color: rgb(var(--color-success));
		border-style: dashed;
		background: rgba(var(--color-success), 0.05);
		box-shadow: var(--shadow-lg);
	}

	.folder-icon {
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

	.folder-info {
		width: 100%;
		overflow: hidden;
	}

	.folder-name {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

	.folder-card:hover .menu-button {
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
