<script lang="ts">
	import type { Database } from '@picture/shared/types';
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

	type Image = Database['public']['Tables']['images']['Row'];
	type Tag = Database['public']['Tables']['tags']['Row'];

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
	const currentIndex = $derived(image ? $images.findIndex((img) => img.id === image.id) : -1);

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

		isArchiving = true;
		try {
			await archiveImage(image.id);
			// Update store
			images.update((current) => current.filter((img) => img.id !== image.id));
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
		if (
			!confirm(
				'Bist du sicher, dass du dieses Bild löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.'
			)
		)
			return;

		isDeleting = true;
		try {
			await deleteImage(image.id);
			// Update store
			images.update((current) => current.filter((img) => img.id !== image.id));
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
		if (!image) return;
		const filename = `picture-${image.id}.png`;
		downloadImage(image.public_url, filename);
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
				image = { ...image, is_public: true };
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
				image = { ...image, is_public: false };
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
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
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
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
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
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
				/>
			</svg>
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
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
				/>
			</svg>
		</button>

		<!-- Publish Button -->
		<button
			onclick={(e) => {
				e.stopPropagation();
				openPublishModal();
			}}
			class="fixed right-4 top-[17rem] z-[60] flex h-12 w-12 items-center justify-center rounded-full transition-all {image?.is_public
				? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
				: 'bg-white/10 text-white hover:bg-white/20'} backdrop-blur-xl"
			aria-label="Veröffentlichen"
		>
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
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
					<svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
			{/if}

			<!-- Image -->
			<img
				src={image.public_url}
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
					<svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
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
									<p class="text-sm text-white">{image.model_id || 'Unknown'}</p>
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
									<p class="text-sm text-white">{formatDate(image.created_at)}</p>
								</div>

								<!-- Actions -->
								<div class="flex gap-2">
									<button
										onclick={handleDownload}
										class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-xl transition-all hover:bg-white/30"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
											/>
										</svg>
										Download
									</button>

									<button
										onclick={handleArchive}
										disabled={isArchiving || isDeleting}
										class="flex items-center justify-center gap-2 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-xl transition-all hover:bg-white/30 disabled:opacity-50"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
											/>
										</svg>
									</button>

									<button
										onclick={handleDelete}
										disabled={isArchiving || isDeleting}
										class="flex items-center justify-center gap-2 rounded-lg bg-red-500/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-xl transition-all hover:bg-red-500/30 disabled:opacity-50"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
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
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
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
									<svg
										class="h-5 w-5 text-blue-600 dark:text-blue-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
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
						{image.is_public ? 'Veröffentlichung entfernen' : 'Bild veröffentlichen'}
					</h2>
					<button
						onclick={closePublishModal}
						class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
						aria-label="Schließen"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{#if image.is_public}
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
