<script lang="ts">
	import type { Image } from '$lib/api/images';
	import type { Tag } from '$lib/api/tags';
	import {
		archiveImage,
		deleteImage,
		downloadImage,
		publishImage,
		unpublishImage,
	} from '$lib/api/images';
	import { images, selectedImage } from '$lib/stores/images';
	import { showToast } from '$lib/stores/toast';
	import { fade, fly } from 'svelte/transition';
	import { getImageTags, getAllTags, addTagToImage, removeTagFromImage } from '$lib/api/tags';
	import {
		X,
		Info,
		Tag as TagIcon,
		DownloadSimple,
		Globe,
		CaretLeft,
		CaretRight,
		Archive,
		Trash,
		Check,
	} from '@manacore/shared-icons';

	interface Props {
		image: Image | null;
		onClose: () => void;
	}

	let { image, onClose }: Props = $props();

	let isArchiving = $state(false);
	let isDeleting = $state(false);
	let imageTags = $state<Tag[]>([]);
	let showInfo = $state(false);
	let showTagModal = $state(false);
	let showPublishModal = $state(false);
	let allTags = $state<Tag[]>([]);
	let isLoadingTags = $state(false);
	let isPublishing = $state(false);

	// Get current image index
	const currentIndex = $derived(image ? $images.findIndex((img) => img.id === image?.id) : -1);

	const hasPrevious = $derived(currentIndex > 0);
	const hasNext = $derived(currentIndex >= 0 && currentIndex < $images.length - 1);

	// Load tags for current image
	$effect(() => {
		if (image) {
			loadImageTags(image.id);
		}
	});

	async function loadImageTags(imageId: string) {
		try {
			imageTags = await getImageTags(imageId);
		} catch (error) {
			console.error('Error loading image tags:', error);
		}
	}

	function navigatePrevious() {
		if (hasPrevious) {
			selectedImage.set($images[currentIndex - 1]);
		}
	}

	function navigateNext() {
		if (hasNext) {
			selectedImage.set($images[currentIndex + 1]);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!image) return;

		switch (e.key) {
			case 'Escape':
				onClose();
				break;
			case 'ArrowLeft':
				navigatePrevious();
				break;
			case 'ArrowRight':
				navigateNext();
				break;
			case 'i':
			case 'I':
				showInfo = !showInfo;
				break;
		}
	}

	async function handleArchive() {
		if (!image) return;
		const imageId = image.id;

		isArchiving = true;
		try {
			await archiveImage(imageId);
			// Update store
			images.update((current) => current.filter((img) => img.id !== imageId));
			showToast('Bild erfolgreich archiviert', 'success');
			onClose();
		} catch (error) {
			console.error('Error archiving image:', error);
			showToast('Fehler beim Archivieren des Bildes', 'error');
		} finally {
			isArchiving = false;
		}
	}

	async function handleDelete() {
		if (!image) return;
		const imageId = image.id;
		if (
			!confirm(
				'Bist du sicher, dass du dieses Bild löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.'
			)
		)
			return;

		isDeleting = true;
		try {
			await deleteImage(imageId);
			// Update store
			images.update((current) => current.filter((img) => img.id !== imageId));
			showToast('Bild erfolgreich gelöscht', 'success');
			onClose();
		} catch (error) {
			console.error('Error deleting image:', error);
			showToast('Fehler beim Löschen des Bildes', 'error');
		} finally {
			isDeleting = false;
		}
	}

	function handleDownload() {
		if (!image || !image.publicUrl) return;
		const filename = `picture-${image.id}.png`;
		downloadImage(image.publicUrl, filename);
		showToast('Download gestartet', 'success');
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('de-DE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
	}

	async function openTagModal() {
		showTagModal = true;
		isLoadingTags = true;
		try {
			allTags = await getAllTags();
		} catch (error) {
			console.error('Error loading tags:', error);
			showToast('Fehler beim Laden der Tags', 'error');
		} finally {
			isLoadingTags = false;
		}
	}

	function closeTagModal() {
		showTagModal = false;
	}

	async function handleToggleTag(tag: Tag) {
		if (!image) return;

		const isTagged = imageTags.some((t) => t.id === tag.id);

		try {
			if (isTagged) {
				await removeTagFromImage(image.id, tag.id);
				imageTags = imageTags.filter((t) => t.id !== tag.id);
				showToast('Tag entfernt', 'success');
			} else {
				await addTagToImage(image.id, tag.id);
				imageTags = [...imageTags, tag];
				showToast('Tag hinzugefügt', 'success');
			}
		} catch (error) {
			console.error('Error toggling tag:', error);
			showToast('Fehler beim Aktualisieren des Tags', 'error');
		}
	}

	function openPublishModal() {
		showPublishModal = true;
	}

	function closePublishModal() {
		showPublishModal = false;
	}

	async function handlePublish() {
		if (!image) return;

		isPublishing = true;
		try {
			await publishImage(image.id);
			// Update local image state
			if (image) {
				image = { ...image, isPublic: true };
			}
			showToast('Bild erfolgreich veröffentlicht!', 'success');
			closePublishModal();
		} catch (error) {
			console.error('Error publishing image:', error);
			showToast('Fehler beim Veröffentlichen des Bildes', 'error');
		} finally {
			isPublishing = false;
		}
	}

	async function handleUnpublish() {
		if (!image) return;

		isPublishing = true;
		try {
			await unpublishImage(image.id);
			// Update local image state
			if (image) {
				image = { ...image, isPublic: false };
			}
			showToast('Bild nicht mehr öffentlich', 'success');
			closePublishModal();
		} catch (error) {
			console.error('Error unpublishing image:', error);
			showToast('Fehler beim Entfernen der Veröffentlichung', 'error');
		} finally {
			isPublishing = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if image}
	<!-- Fullscreen Viewer -->
	<div
		class="fixed inset-0 z-50 bg-black"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
		role="dialog"
		aria-modal="true"
	>
		<!-- Close Button -->
		<button
			onclick={onClose}
			class="fixed right-4 top-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition-all hover:bg-white/20"
			aria-label="Schließen"
		>
			<X size={24} weight="bold" />
		</button>

		<!-- Info Toggle -->
		<button
			onclick={(e) => {
				e.stopPropagation();
				showInfo = !showInfo;
			}}
			class="fixed right-4 top-20 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition-all hover:bg-white/20 {showInfo
				? 'bg-white/20'
				: ''}"
			aria-label="Info anzeigen"
		>
			<Info size={24} />
		</button>

		<!-- Tags Button -->
		<button
			onclick={(e) => {
				e.stopPropagation();
				openTagModal();
			}}
			class="fixed right-4 top-36 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition-all hover:bg-white/20"
			aria-label="Tags verwalten"
		>
			<TagIcon size={24} />
		</button>

		<!-- Download Button -->
		<button
			onclick={(e) => {
				e.stopPropagation();
				handleDownload();
			}}
			class="fixed right-4 top-52 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition-all hover:bg-white/20"
			aria-label="Download"
		>
			<DownloadSimple size={24} />
		</button>

		<!-- Publish Button -->
		<button
			onclick={(e) => {
				e.stopPropagation();
				openPublishModal();
			}}
			class="fixed right-4 top-[17rem] z-[60] flex h-12 w-12 items-center justify-center rounded-full transition-all {image?.isPublic
				? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
				: 'bg-white/10 text-white hover:bg-white/20'} backdrop-blur-xl"
			aria-label="Veröffentlichen"
		>
			<Globe size={24} />
		</button>

		<!-- Main Image Container -->
		<div class="flex h-full w-full items-center justify-center p-4 pb-16">
			<!-- Previous Button -->
			{#if hasPrevious}
				<button
					onclick={(e) => {
						e.stopPropagation();
						navigatePrevious();
					}}
					class="absolute left-4 top-1/2 z-[60] flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition-all hover:bg-white/20"
					aria-label="Vorheriges Bild"
				>
					<CaretLeft size={28} weight="bold" />
				</button>
			{/if}

			<!-- Image -->
			<img
				src={image.publicUrl}
				alt={image.prompt}
				class="max-h-full max-w-full object-contain"
				onclick={(e) => e.stopPropagation()}
			/>

			<!-- Next Button -->
			{#if hasNext}
				<button
					onclick={(e) => {
						e.stopPropagation();
						navigateNext();
					}}
					class="absolute right-4 top-1/2 z-[60] flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition-all hover:bg-white/20"
					aria-label="Nächstes Bild"
				>
					<CaretRight size={28} weight="bold" />
				</button>
			{/if}
		</div>

		<!-- Bottom Bar with Info -->
		<div class="fixed bottom-0 left-0 right-0 z-[60] p-4">
			<div class="mx-auto max-w-4xl">
				<!-- Prompt Preview (always visible) -->
				<div class="mb-2" onclick={(e) => e.stopPropagation()}>
					<p class="text-center text-sm text-white/90">
						{image.prompt}
					</p>
				</div>

				<!-- Detailed Info Panel (toggleable) -->
				{#if showInfo}
					<div
						class="rounded-2xl bg-white/10 p-6 backdrop-blur-xl"
						onclick={(e) => e.stopPropagation()}
						transition:fly={{ y: 20, duration: 200 }}
					>
						<div class="grid gap-4 md:grid-cols-2">
							<!-- Left Column -->
							<div class="space-y-4">
								<div>
									<h3 class="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">
										Prompt
									</h3>
									<p class="text-sm text-white">{image.prompt}</p>
								</div>

								<div>
									<h3 class="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">
										Model
									</h3>
									<p class="text-sm text-white">{image.model || 'Unknown'}</p>
								</div>

								{#if imageTags.length > 0}
									<div>
										<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
											Tags
										</h3>
										<div class="flex flex-wrap gap-2">
											{#each imageTags as tag}
												<span
													class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-xl"
												>
													{#if tag.color}
														<span
															class="h-2 w-2 rounded-full"
															style="background-color: {tag.color};"
														></span>
													{/if}
													{tag.name}
												</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>

							<!-- Right Column -->
							<div class="space-y-4">
								<div>
									<h3 class="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">
										Erstellt
									</h3>
									<p class="text-sm text-white">{formatDate(image.createdAt)}</p>
								</div>

								<!-- Actions -->
								<div class="flex gap-2">
									<button
										onclick={handleDownload}
										class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-xl transition-all hover:bg-white/30"
									>
										<DownloadSimple size={16} />
										Download
									</button>

									<button
										onclick={handleArchive}
										disabled={isArchiving || isDeleting}
										class="flex items-center justify-center gap-2 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-xl transition-all hover:bg-white/30 disabled:opacity-50"
									>
										<Archive size={16} />
									</button>

									<button
										onclick={handleDelete}
										disabled={isArchiving || isDeleting}
										class="flex items-center justify-center gap-2 rounded-lg bg-red-500/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-xl transition-all hover:bg-red-500/30 disabled:opacity-50"
									>
										<Trash size={16} />
									</button>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Tag Modal -->
	{#if showTagModal}
		<div
			class="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
			transition:fade={{ duration: 200 }}
			onclick={closeTagModal}
			role="dialog"
			aria-modal="true"
		>
			<div
				class="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-gray-800"
				onclick={(e) => e.stopPropagation()}
				transition:fly={{ y: 20, duration: 200 }}
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Tags verwalten</h2>
					<button
						onclick={closeTagModal}
						class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
						aria-label="Schließen"
					>
						<X size={20} weight="bold" />
					</button>
				</div>

				{#if isLoadingTags}
					<div class="flex items-center justify-center py-8">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
						></div>
					</div>
				{:else if allTags.length === 0}
					<p class="py-8 text-center text-gray-500 dark:text-gray-400">Keine Tags verfügbar</p>
				{:else}
					<div class="max-h-96 space-y-2 overflow-y-auto">
						{#each allTags as tag}
							{@const isSelected = imageTags.some((t) => t.id === tag.id)}
							<button
								onclick={() => handleToggleTag(tag)}
								class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all {isSelected
									? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
									: 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600'}"
							>
								<div class="flex items-center gap-3">
									{#if tag.color}
										<span class="h-4 w-4 rounded-full" style="background-color: {tag.color};"
										></span>
									{/if}
									<span
										class="font-medium {isSelected
											? 'text-blue-900 dark:text-blue-100'
											: 'text-gray-900 dark:text-gray-100'}"
									>
										{tag.name}
									</span>
								</div>
								{#if isSelected}
									<Check size={20} weight="bold" class="text-blue-600 dark:text-blue-400" />
								{/if}
							</button>
						{/each}
					</div>
				{/if}

				<div class="mt-4 flex justify-end">
					<button
						onclick={closeTagModal}
						class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						Fertig
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Publish Modal -->
	{#if showPublishModal && image}
		<div
			class="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
			transition:fade={{ duration: 200 }}
			onclick={closePublishModal}
			role="dialog"
			aria-modal="true"
		>
			<div
				class="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800"
				onclick={(e) => e.stopPropagation()}
				transition:fly={{ y: 20, duration: 200 }}
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
						{image.isPublic ? 'Veröffentlichung entfernen' : 'Bild veröffentlichen'}
					</h2>
					<button
						onclick={closePublishModal}
						class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
						aria-label="Schließen"
					>
						<X size={20} weight="bold" />
					</button>
				</div>

				{#if image.isPublic}
					<div class="mb-6">
						<p class="text-gray-600 dark:text-gray-400">
							Dieses Bild ist derzeit öffentlich und kann von anderen Nutzern im Explore-Bereich
							gesehen werden.
						</p>
						<p class="mt-2 text-gray-600 dark:text-gray-400">
							Möchtest du die Veröffentlichung entfernen?
						</p>
					</div>

					<div class="flex gap-3">
						<button
							onclick={closePublishModal}
							disabled={isPublishing}
							class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Abbrechen
						</button>
						<button
							onclick={handleUnpublish}
							disabled={isPublishing}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
						>
							{#if isPublishing}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"
								></div>
							{/if}
							Entfernen
						</button>
					</div>
				{:else}
					<div class="mb-6">
						<p class="text-gray-600 dark:text-gray-400">
							Möchtest du dieses Bild veröffentlichen? Es wird dann im Explore-Bereich für alle
							Nutzer sichtbar sein.
						</p>
						<div class="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
							<p class="text-sm text-blue-800 dark:text-blue-300">
								💡 Tipp: Füge Tags hinzu, damit andere Nutzer dein Bild leichter finden können.
							</p>
						</div>
					</div>

					<div class="flex gap-3">
						<button
							onclick={closePublishModal}
							disabled={isPublishing}
							class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Abbrechen
						</button>
						<button
							onclick={handlePublish}
							disabled={isPublishing}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
						>
							{#if isPublishing}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"
								></div>
							{/if}
							Veröffentlichen
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
{/if}
