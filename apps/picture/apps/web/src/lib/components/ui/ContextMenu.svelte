<script lang="ts">
	import { onMount } from 'svelte';
	import { contextMenu, hideContextMenu, showTagSubmenu, hideTagSubmenu } from '$lib/stores/contextMenu';
	import { tags } from '$lib/stores/tags';
	import { user } from '$lib/stores/auth';
	import { addTagToImage, removeTagFromImage, getImageTags } from '$lib/api/tags';
	import { archiveImage, unarchiveImage, deleteImage, toggleFavorite } from '$lib/api/images';
	import { images } from '$lib/stores/images';
	import { archivedImages } from '$lib/stores/archive';
	import { showToast } from '$lib/stores/toast';
	import type { Database } from '@picture/shared/types';

	type Tag = Database['public']['Tables']['tags']['Row'];

	let tagSubmenuElement = $state<HTMLElement | null>(null);
	let imageTags = $state<Tag[]>([]);

	// Check if current image is archived
	const isArchived = $derived($contextMenu.image?.archived_at !== null && $contextMenu.image?.archived_at !== undefined);

	// Check if current image is favorite
	const isFavorite = $derived($contextMenu.image?.is_favorite === true);

	// Check if current image belongs to current user
	const isOwnImage = $derived($contextMenu.image?.user_id === $user?.id);

	interface MenuItem {
		label: string;
		icon: string;
		action: () => void;
		submenu?: boolean;
		divider?: boolean;
		filled?: boolean; // For filled icons like favorite
	}

	$effect(() => {
		if ($contextMenu.image) {
			loadImageTags($contextMenu.image.id);
		}
	});

	async function loadImageTags(imageId: string) {
		try {
			imageTags = await getImageTags(imageId);
		} catch (error) {
			console.error('Error loading image tags:', error);
		}
	}

	function handleTagsMouseEnter(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		showTagSubmenu(rect.right, rect.top);
	}

	async function handleAddTag(tag: Tag) {
		if (!$contextMenu.image) return;

		try {
			await addTagToImage($contextMenu.image.id, tag.id);
			await loadImageTags($contextMenu.image.id);
			showToast(`Tag "${tag.name}" hinzugefügt`, 'success');
		} catch (error) {
			console.error('Error adding tag:', error);
			showToast('Fehler beim Hinzufügen des Tags', 'error');
		}
	}

	async function handleRemoveTag(tag: Tag) {
		if (!$contextMenu.image) return;

		try {
			await removeTagFromImage($contextMenu.image.id, tag.id);
			await loadImageTags($contextMenu.image.id);
			showToast(`Tag "${tag.name}" entfernt`, 'success');
		} catch (error) {
			console.error('Error removing tag:', error);
			showToast('Fehler beim Entfernen des Tags', 'error');
		}
	}

	function handleDownload() {
		if (!$contextMenu.image?.public_url) return;

		const link = document.createElement('a');
		link.href = $contextMenu.image.public_url;
		link.download = $contextMenu.image.filename || 'image.png';
		link.click();
		hideContextMenu();
		showToast('Download gestartet', 'success');
	}

	function handleCopyLink() {
		if (!$contextMenu.image?.public_url) return;

		navigator.clipboard.writeText($contextMenu.image.public_url);
		hideContextMenu();
		showToast('Link kopiert', 'success');
	}

	async function handleDelete() {
		if (!$contextMenu.image) return;

		if (confirm('Möchten Sie dieses Bild wirklich löschen?')) {
			try {
				await deleteImage($contextMenu.image.id);
				// Remove from store
				images.update((current) => current.filter((img) => img.id !== $contextMenu.image?.id));
				hideContextMenu();
				showToast('Bild gelöscht', 'success');
			} catch (error) {
				console.error('Error deleting image:', error);
				showToast('Fehler beim Löschen des Bildes', 'error');
			}
		}
	}

	async function handleArchive() {
		if (!$contextMenu.image) return;

		try {
			if (isArchived) {
				// Unarchive: Move back to gallery
				await unarchiveImage($contextMenu.image.id);
				// Remove from archive store
				archivedImages.update((current) => current.filter((img) => img.id !== $contextMenu.image?.id));
				hideContextMenu();
				showToast('Bild wiederhergestellt', 'success');
			} else {
				// Archive: Move to archive
				await archiveImage($contextMenu.image.id);
				// Remove from gallery store
				images.update((current) => current.filter((img) => img.id !== $contextMenu.image?.id));
				hideContextMenu();
				showToast('Bild archiviert', 'success');
			}
		} catch (error) {
			console.error('Error archiving/unarchiving image:', error);
			showToast('Fehler beim Archivieren des Bildes', 'error');
		}
	}

	async function handleToggleFavorite() {
		if (!$contextMenu.image) return;

		try {
			const newFavoriteStatus = !isFavorite;
			await toggleFavorite($contextMenu.image.id, newFavoriteStatus);

			// Update in all stores
			images.update((current) =>
				current.map((img) =>
					img.id === $contextMenu.image?.id ? { ...img, is_favorite: newFavoriteStatus } : img
				)
			);
			archivedImages.update((current) =>
				current.map((img) =>
					img.id === $contextMenu.image?.id ? { ...img, is_favorite: newFavoriteStatus } : img
				)
			);

			hideContextMenu();
			showToast(
				newFavoriteStatus ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt',
				'success'
			);
		} catch (error) {
			console.error('Error toggling favorite:', error);
			showToast('Fehler beim Aktualisieren der Favoriten', 'error');
		}
	}

	const menuItems = $derived([
		{
			label: 'Herunterladen',
			icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
			action: handleDownload
		},
		{
			label: 'Link kopieren',
			icon: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3',
			action: handleCopyLink
		},
		{
			label: isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten',
			icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
			action: handleToggleFavorite,
			filled: isFavorite
		},
		{
			label: 'Tags',
			icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
			action: () => {},
			submenu: true,
			divider: true
		},
		// Only show Archive/Restore for own images
		...(isOwnImage ? [{
			label: isArchived ? 'Wiederherstellen' : 'Archivieren',
			icon: isArchived
				? 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
				: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
			action: handleArchive,
			divider: true
		}] : []),
		// Only show Delete for own images
		...(isOwnImage ? [{
			label: 'Löschen',
			icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
			action: handleDelete
		}] : [])
	] as MenuItem[]);

	function handleClick() {
		hideContextMenu();
	}

	onMount(() => {
		// Close menu on click outside
		const handleClickOutside = () => {
			hideContextMenu();
		};

		window.addEventListener('click', handleClickOutside);

		return () => {
			window.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<svelte:window
	on:contextmenu={(e) => {
		if ($contextMenu.visible) {
			e.preventDefault();
		}
	}}
/>

{#if $contextMenu.visible}
	<div
		class="fixed z-[60] min-w-[200px] rounded-2xl border border-gray-200/50 bg-white/95 py-2 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
		style="left: {$contextMenu.x}px; top: {$contextMenu.y}px;"
		onclick={(e) => e.stopPropagation()}
		role="menu"
	>
		{#each menuItems as item}
			{#if item.divider}
				<div class="my-2 border-t border-gray-200 dark:border-gray-700"></div>
			{/if}

			<button
				onclick={() => {
					if (!item.submenu) {
						item.action();
					}
				}}
				onmouseenter={item.submenu ? handleTagsMouseEnter : hideTagSubmenu}
				class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 {item.label === 'Löschen' ? 'text-red-600 dark:text-red-400' : ''}"
				role="menuitem"
			>
				<svg class="h-4 w-4 flex-shrink-0" fill={item.filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
				</svg>
				<span class="flex-1">{item.label}</span>
				{#if item.submenu}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Tag Submenu -->
	{#if $contextMenu.showTagSubmenu}
		<div
			bind:this={tagSubmenuElement}
			class="fixed z-[70] min-w-[220px] max-h-[400px] overflow-y-auto rounded-2xl border border-gray-200/50 bg-white/95 py-2 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
			style="left: {$contextMenu.submenuX}px; top: {$contextMenu.submenuY}px;"
			onclick={(e) => e.stopPropagation()}
			onmouseleave={hideTagSubmenu}
			role="menu"
		>
			{#if $tags.length === 0}
				<div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
					Keine Tags vorhanden
				</div>
			{:else}
				<div class="px-3 pb-2 pt-1">
					<p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
						Tags hinzufügen/entfernen
					</p>
				</div>
				{#each $tags as tag}
					{@const hasTag = imageTags.some((t) => t.id === tag.id)}
					<button
						onclick={() => {
							if (hasTag) {
								handleRemoveTag(tag);
							} else {
								handleAddTag(tag);
							}
							hideTagSubmenu();
						}}
						class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
						role="menuitem"
					>
						<div
							class="h-3 w-3 rounded-full flex-shrink-0"
							style="background-color: {tag.color || '#6B7280'};"
						></div>
						<span class="flex-1 text-gray-700 dark:text-gray-300">{tag.name}</span>
						{#if hasTag}
							<svg class="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
{/if}
