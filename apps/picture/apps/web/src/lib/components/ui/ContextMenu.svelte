<script lang="ts">
	import { onMount } from 'svelte';
	import {
		contextMenu,
		hideContextMenu,
		showTagSubmenu,
		hideTagSubmenu,
	} from '$lib/stores/contextMenu';
	import { getContext } from 'svelte';
	import type { Tag } from '@manacore/shared-tags';
	import { authStore } from '$lib/stores/auth.svelte';

	const allTags: { value: Tag[] } = getContext('tags');
	import { addTagToImage, removeTagFromImage, getImageTags } from '$lib/api/tags';
	import { imageCollection } from '$lib/data/local-store';
	import { toastStore } from '@manacore/shared-ui';
	import {
		DownloadSimple,
		Link,
		Heart,
		Tag as TagIcon,
		Archive,
		ArrowCounterClockwise,
		Trash,
		CaretRight,
		Check,
	} from '@manacore/shared-icons';

	let tagSubmenuElement = $state<HTMLElement | null>(null);
	let imageTags = $state<Tag[]>([]);

	// Check if current image is archived
	const isArchived = $derived(
		$contextMenu.image?.archivedAt !== null && $contextMenu.image?.archivedAt !== undefined
	);

	// Check if current image is favorite
	const isFavorite = $derived($contextMenu.image?.isFavorite === true);

	// Check if current image belongs to current user
	const isOwnImage = $derived($contextMenu.image?.userId === authStore.user?.id);

	type IconName = 'download' | 'link' | 'heart' | 'tag' | 'archive' | 'restore' | 'trash';

	interface MenuItem {
		label: string;
		iconName: IconName;
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
			toastStore.show(`Tag "${tag.name}" hinzugefügt`, 'success');
		} catch (error) {
			console.error('Error adding tag:', error);
			toastStore.show('Fehler beim Hinzufügen des Tags', 'error');
		}
	}

	async function handleRemoveTag(tag: Tag) {
		if (!$contextMenu.image) return;

		try {
			await removeTagFromImage($contextMenu.image.id, tag.id);
			await loadImageTags($contextMenu.image.id);
			toastStore.show(`Tag "${tag.name}" entfernt`, 'success');
		} catch (error) {
			console.error('Error removing tag:', error);
			toastStore.show('Fehler beim Entfernen des Tags', 'error');
		}
	}

	function handleDownload() {
		if (!$contextMenu.image?.publicUrl) return;

		const link = document.createElement('a');
		link.href = $contextMenu.image.publicUrl;
		link.download = $contextMenu.image.filename || 'image.png';
		link.click();
		hideContextMenu();
		toastStore.show('Download gestartet', 'success');
	}

	function handleCopyLink() {
		if (!$contextMenu.image?.publicUrl) return;

		navigator.clipboard.writeText($contextMenu.image.publicUrl);
		hideContextMenu();
		toastStore.show('Link kopiert', 'success');
	}

	async function handleDelete() {
		if (!$contextMenu.image) return;

		if (confirm('Möchten Sie dieses Bild wirklich löschen?')) {
			try {
				await imageCollection.delete($contextMenu.image.id);
				hideContextMenu();
				toastStore.show('Bild gelöscht', 'success');
			} catch (error) {
				console.error('Error deleting image:', error);
				toastStore.show('Fehler beim Löschen des Bildes', 'error');
			}
		}
	}

	async function handleArchive() {
		if (!$contextMenu.image) return;

		try {
			if (isArchived) {
				// Unarchive: clear archivedAt
				await imageCollection.update($contextMenu.image.id, { archivedAt: null });
				hideContextMenu();
				toastStore.show('Bild wiederhergestellt', 'success');
			} else {
				// Archive: set archivedAt
				await imageCollection.update($contextMenu.image.id, {
					archivedAt: new Date().toISOString(),
				});
				hideContextMenu();
				toastStore.show('Bild archiviert', 'success');
			}
		} catch (error) {
			console.error('Error archiving/unarchiving image:', error);
			toastStore.show('Fehler beim Archivieren des Bildes', 'error');
		}
	}

	async function handleToggleFavorite() {
		if (!$contextMenu.image) return;

		try {
			const newFavoriteStatus = !isFavorite;
			await imageCollection.update($contextMenu.image.id, { isFavorite: newFavoriteStatus });

			hideContextMenu();
			toastStore.show(
				newFavoriteStatus ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt',
				'success'
			);
		} catch (error) {
			console.error('Error toggling favorite:', error);
			toastStore.show('Fehler beim Aktualisieren der Favoriten', 'error');
		}
	}

	const menuItems = $derived([
		{
			label: 'Herunterladen',
			iconName: 'download' as IconName,
			action: handleDownload,
		},
		{
			label: 'Link kopieren',
			iconName: 'link' as IconName,
			action: handleCopyLink,
		},
		{
			label: isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten',
			iconName: 'heart' as IconName,
			action: handleToggleFavorite,
			filled: isFavorite,
		},
		{
			label: 'Tags',
			iconName: 'tag' as IconName,
			action: () => {},
			submenu: true,
			divider: true,
		},
		// Only show Archive/Restore for own images
		...(isOwnImage
			? [
					{
						label: isArchived ? 'Wiederherstellen' : 'Archivieren',
						iconName: (isArchived ? 'restore' : 'archive') as IconName,
						action: handleArchive,
						divider: true,
					},
				]
			: []),
		// Only show Delete for own images
		...(isOwnImage
			? [
					{
						label: 'Löschen',
						iconName: 'trash' as IconName,
						action: handleDelete,
					},
				]
			: []),
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
				class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 {item.label ===
				'Löschen'
					? 'text-red-600 dark:text-red-400'
					: ''}"
				role="menuitem"
			>
				<span class="flex-shrink-0">
					{#if item.iconName === 'download'}
						<DownloadSimple size={16} weight={item.filled ? 'fill' : 'regular'} />
					{:else if item.iconName === 'link'}
						<Link size={16} weight={item.filled ? 'fill' : 'regular'} />
					{:else if item.iconName === 'heart'}
						<Heart size={16} weight={item.filled ? 'fill' : 'regular'} />
					{:else if item.iconName === 'tag'}
						<TagIcon size={16} weight={item.filled ? 'fill' : 'regular'} />
					{:else if item.iconName === 'archive'}
						<Archive size={16} weight={item.filled ? 'fill' : 'regular'} />
					{:else if item.iconName === 'restore'}
						<ArrowCounterClockwise size={16} weight={item.filled ? 'fill' : 'regular'} />
					{:else if item.iconName === 'trash'}
						<Trash size={16} weight={item.filled ? 'fill' : 'regular'} />
					{/if}
				</span>
				<span class="flex-1">{item.label}</span>
				{#if item.submenu}
					<CaretRight size={16} />
				{/if}
			</button>
		{/each}
	</div>

	<!-- Tag Submenu -->
	{#if $contextMenu.showTagSubmenu}
		<div
			bind:this={tagSubmenuElement}
			class="fixed z-[70] max-h-[400px] min-w-[220px] overflow-y-auto rounded-2xl border border-gray-200/50 bg-white/95 py-2 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
			style="left: {$contextMenu.submenuX}px; top: {$contextMenu.submenuY}px;"
			onclick={(e) => e.stopPropagation()}
			onmouseleave={hideTagSubmenu}
			role="menu"
		>
			{#if allTags.value.length === 0}
				<div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Keine Tags vorhanden</div>
			{:else}
				<div class="px-3 pb-2 pt-1">
					<p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
						Tags hinzufügen/entfernen
					</p>
				</div>
				{#each allTags.value as tag}
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
							class="h-3 w-3 flex-shrink-0 rounded-full"
							style="background-color: {tag.color || '#6B7280'};"
						></div>
						<span class="flex-1 text-gray-700 dark:text-gray-300">{tag.name}</span>
						{#if hasTag}
							<Check size={16} weight="bold" class="text-blue-600 dark:text-blue-400" />
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
{/if}
