<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { decksStore } from '$lib/modules/presi/stores/decks.svelte';
	import { useDeck, useDeckSlides } from '$lib/modules/presi/queries';
	import type { Slide, SlideContent } from '$lib/modules/presi/types';
	import {
		ArrowLeft,
		Play,
		Plus,
		Trash,
		CaretUp,
		CaretDown,
		Image,
		TextT,
		List,
		PencilSimple,
		X,
		FloppyDisk,
		ShareNetwork,
	} from '@manacore/shared-icons';
	import { ShareModal } from '@manacore/shared-uload';

	let showSlideModal = $state(false);
	let editingSlide = $state<Slide | null>(null);
	let showDeleteModal = $state(false);
	let slideToDelete = $state<Slide | null>(null);

	let slideTitle = $state('');
	let slideBody = $state('');
	let slideBulletPoints = $state<string[]>(['']);
	let slideImageUrl = $state('');
	let isSaving = $state(false);
	let showShare = $state(false);

	const deckId = $page.params.id as string;
	const deckQuery = useDeck(deckId);
	const slidesQuery = useDeckSlides(deckId);
	let currentDeck = $derived(deckQuery.value);
	let currentSlides = $derived(slidesQuery.value ?? []);

	function openCreateSlide() {
		editingSlide = null;
		slideTitle = '';
		slideBody = '';
		slideBulletPoints = [''];
		slideImageUrl = '';
		showSlideModal = true;
	}

	function openEditSlide(slide: Slide) {
		editingSlide = slide;
		slideTitle = slide.content.title || '';
		slideBody = slide.content.body || '';
		slideBulletPoints = slide.content.bulletPoints?.length ? [...slide.content.bulletPoints] : [''];
		slideImageUrl = slide.content.imageUrl || '';
		showSlideModal = true;
	}

	async function handleSaveSlide(e: SubmitEvent) {
		e.preventDefault();
		isSaving = true;
		const content: SlideContent = {
			type: slideImageUrl
				? 'image'
				: slideBulletPoints.filter((b) => b.trim()).length > 0
					? 'content'
					: 'title',
			title: slideTitle || undefined,
			body: slideBody || undefined,
			bulletPoints: slideBulletPoints.filter((b) => b.trim()),
			imageUrl: slideImageUrl || undefined,
		};
		if (editingSlide) {
			await decksStore.updateSlide(editingSlide.id, { content });
		} else {
			await decksStore.createSlide(deckId, { content });
		}
		isSaving = false;
		showSlideModal = false;
	}

	function confirmDeleteSlide(slide: Slide) {
		slideToDelete = slide;
		showDeleteModal = true;
	}

	async function handleDeleteSlide() {
		if (!slideToDelete) return;
		await decksStore.deleteSlide(slideToDelete.id);
		showDeleteModal = false;
		slideToDelete = null;
	}

	async function moveSlide(slide: Slide, direction: 'up' | 'down') {
		const slides = currentSlides;
		const currentIndex = slides.findIndex((s) => s.id === slide.id);
		if (currentIndex === -1) return;
		const newSlides = slides.map((s, i) => ({ id: s.id, order: i + 1 }));
		if (direction === 'up' && currentIndex > 0) {
			[newSlides[currentIndex], newSlides[currentIndex - 1]] = [
				newSlides[currentIndex - 1],
				newSlides[currentIndex],
			];
		} else if (direction === 'down' && currentIndex < slides.length - 1) {
			[newSlides[currentIndex], newSlides[currentIndex + 1]] = [
				newSlides[currentIndex + 1],
				newSlides[currentIndex],
			];
		}
		newSlides.forEach((s, i) => (s.order = i + 1));
		await decksStore.reorderSlides(newSlides);
	}

	function addBulletPoint() {
		slideBulletPoints = [...slideBulletPoints, ''];
	}
	function removeBulletPoint(index: number) {
		slideBulletPoints = slideBulletPoints.filter((_, i) => i !== index);
		if (slideBulletPoints.length === 0) slideBulletPoints = [''];
	}
	function updateBulletPoint(index: number, value: string) {
		slideBulletPoints[index] = value;
	}
</script>

<svelte:head>
	<title>{currentDeck?.title || 'Loading...'} - Presi</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	{#if currentDeck}
		<div class="flex items-center justify-between mb-8">
			<div class="flex items-center gap-4">
				<a
					href="/presi"
					class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
				>
					<ArrowLeft class="w-5 h-5 text-slate-600 dark:text-slate-400" />
				</a>
				<div>
					<h1 class="text-2xl font-bold text-slate-900 dark:text-white">{currentDeck.title}</h1>
					{#if currentDeck.description}
						<p class="text-slate-600 dark:text-slate-400 mt-1">{currentDeck.description}</p>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={openCreateSlide}
					class="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
				>
					<Plus class="w-5 h-5" /> Add Slide
				</button>
				<button
					onclick={() => (showShare = true)}
					class="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
					title="Kurzlink teilen"
				>
					<ShareNetwork size={20} />
				</button>
				{#if currentSlides.length > 0}
					<a
						href="/presi/present/{deckId}"
						class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
					>
						<Play class="w-5 h-5" /> Present
					</a>
				{/if}
			</div>
		</div>

		{#if currentSlides.length === 0}
			<div class="text-center py-16">
				<div
					class="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"
				>
					<TextT class="w-8 h-8 text-slate-400" />
				</div>
				<h2 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No slides yet</h2>
				<button
					onclick={openCreateSlide}
					class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
				>
					<Plus class="w-5 h-5" /> Add Slide
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each currentSlides as slide, index (slide.id)}
					<div
						class="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
					>
						<button
							onclick={() => openEditSlide(slide)}
							class="w-full aspect-video bg-slate-100 dark:bg-slate-700 p-4 flex flex-col items-center justify-center text-left"
						>
							{#if slide.content.imageUrl}
								<img
									src={slide.content.imageUrl}
									alt={slide.content.title || 'Slide'}
									class="w-full h-full object-cover"
								/>
							{:else}
								<div class="w-full h-full flex flex-col items-center justify-center p-4">
									{#if slide.content.title}<h3
											class="text-lg font-semibold text-slate-900 dark:text-white text-center line-clamp-2"
										>
											{slide.content.title}
										</h3>{/if}
									{#if slide.content.bulletPoints?.length}
										<ul class="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
											{#each slide.content.bulletPoints.slice(0, 3) as point}<li class="truncate">
													• {point}
												</li>{/each}
										</ul>
									{/if}
								</div>
							{/if}
						</button>
						<div
							class="p-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700"
						>
							<span class="text-sm text-slate-500">Slide {index + 1}</span>
							<div
								class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<button
									onclick={() => moveSlide(slide, 'up')}
									disabled={index === 0}
									class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
									><CaretUp class="w-4 h-4 text-slate-600 dark:text-slate-400" /></button
								>
								<button
									onclick={() => moveSlide(slide, 'down')}
									disabled={index === currentSlides.length - 1}
									class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
									><CaretDown class="w-4 h-4 text-slate-600 dark:text-slate-400" /></button
								>
								<button
									onclick={() => openEditSlide(slide)}
									class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
									><PencilSimple class="w-4 h-4 text-slate-600 dark:text-slate-400" /></button
								>
								<button
									onclick={() => confirmDeleteSlide(slide)}
									class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
									><Trash class="w-4 h-4 text-red-500" /></button
								>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Slide Editor Modal -->
{#if showSlideModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
		<div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl my-8">
			<form onsubmit={handleSaveSlide}>
				<div
					class="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"
				>
					<h2 class="text-xl font-semibold text-slate-900 dark:text-white">
						{editingSlide ? 'Edit Slide' : 'New Slide'}
					</h2>
					<button
						type="button"
						onclick={() => (showSlideModal = false)}
						class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
						><X class="w-5 h-5 text-slate-600 dark:text-slate-400" /></button
					>
				</div>
				<div class="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
					<div>
						<label
							for="slideTitle"
							class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label
						>
						<input
							type="text"
							id="slideTitle"
							bind:value={slideTitle}
							class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
							placeholder="Slide title"
						/>
					</div>
					<div>
						<label
							for="slideImage"
							class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
							><span class="flex items-center gap-2"
								><Image class="w-4 h-4" /> Image URL (optional)</span
							></label
						>
						<input
							type="url"
							id="slideImage"
							bind:value={slideImageUrl}
							class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
							placeholder="https://example.com/image.jpg"
						/>
					</div>
					<div>
						<label
							for="slideBody"
							class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
							>Body Text (optional)</label
						>
						<textarea
							id="slideBody"
							bind:value={slideBody}
							rows="3"
							class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
							placeholder="Main content text..."
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
							><span class="flex items-center gap-2"><List class="w-4 h-4" /> Bullet Points</span
							></label
						>
						<div class="space-y-2">
							{#each slideBulletPoints as point, index}
								<div class="flex items-center gap-2">
									<span class="text-slate-400">•</span>
									<input
										type="text"
										value={point}
										oninput={(e) => updateBulletPoint(index, (e.target as HTMLInputElement).value)}
										class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
										placeholder="Add a point..."
									/>
									<button
										type="button"
										onclick={() => removeBulletPoint(index)}
										class="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
										><X class="w-4 h-4 text-red-500" /></button
									>
								</div>
							{/each}
							<button
								type="button"
								onclick={addBulletPoint}
								class="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"
								><Plus class="w-4 h-4" /> Add bullet point</button
							>
						</div>
					</div>
				</div>
				<div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
					<button
						type="button"
						onclick={() => (showSlideModal = false)}
						class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
						>Cancel</button
					>
					<button
						type="submit"
						disabled={isSaving}
						class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
						><FloppyDisk class="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Slide Modal -->
{#if showDeleteModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
		<div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
			<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">Delete Slide</h2>
			<p class="text-slate-600 dark:text-slate-400 mb-6">
				Are you sure you want to delete this slide?
			</p>
			<div class="flex justify-end gap-3">
				<button
					onclick={() => {
						showDeleteModal = false;
						slideToDelete = null;
					}}
					class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
					>Cancel</button
				>
				<button
					onclick={handleDeleteSlide}
					class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
					>Delete</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- Share Modal (uLoad integration) -->
<ShareModal
	visible={showShare}
	onClose={() => (showShare = false)}
	url={typeof window !== 'undefined' ? `${window.location.origin}/presi/deck/${deckId}` : ''}
	title={currentDeck?.name ?? 'Presentation'}
	source="presi"
	description={currentDeck?.description ?? ''}
/>
