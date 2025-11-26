<script lang="ts">
	import type { Story, StoryPage } from '$lib/types/story';
	import StoryPageView from './StoryPageView.svelte';
	import StoryStartScreen from './StoryStartScreen.svelte';
	import StoryEndScreen from './StoryEndScreen.svelte';

	interface Props {
		story: Story;
		onClose: () => void;
		onArchive?: () => void;
		onToggleFavorite?: () => void;
	}

	let { story, onClose, onArchive, onToggleFavorite }: Props = $props();

	// Current page index: -1 = start, 0-n = story pages, n+1 = end
	let currentPage = $state(-1);
	let isFullscreen = $state(false);

	// Total pages including start and end screens
	let totalPages = $derived(story.pages.length + 2);

	// Navigation
	function goToPage(index: number) {
		if (index >= -1 && index <= story.pages.length) {
			currentPage = index;
		}
	}

	function nextPage() {
		if (currentPage < story.pages.length) {
			currentPage++;
		}
	}

	function prevPage() {
		if (currentPage > -1) {
			currentPage--;
		}
	}

	function restart() {
		currentPage = -1;
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowRight':
			case ' ':
				event.preventDefault();
				nextPage();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				prevPage();
				break;
			case 'Escape':
				event.preventDefault();
				if (isFullscreen) {
					isFullscreen = false;
				} else {
					onClose();
				}
				break;
			case 'f':
			case 'F':
				event.preventDefault();
				isFullscreen = !isFullscreen;
				break;
			case 'Home':
				event.preventDefault();
				restart();
				break;
			case 'End':
				event.preventDefault();
				currentPage = story.pages.length;
				break;
		}
	}

	// Click to advance
	function handleClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		// Don't advance if clicking on buttons
		if (target.closest('button') || target.closest('a')) return;

		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const x = event.clientX - rect.left;
		const width = rect.width;

		// Click on left third = prev, right two-thirds = next
		if (x < width / 3) {
			prevPage();
		} else {
			nextPage();
		}
	}

	// Page indicator text
	let pageIndicator = $derived.by(() => {
		if (currentPage === -1) return 'Titelseite';
		if (currentPage === story.pages.length) return 'Ende';
		return `Seite ${currentPage + 1} von ${story.pages.length}`;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 flex flex-col bg-gray-900"
	class:cursor-pointer={currentPage < story.pages.length}
	onclick={handleClick}
	role="presentation"
>
	<!-- Header (hidden in fullscreen) -->
	{#if !isFullscreen}
		<header class="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
			<!-- Back Button -->
			<button
				onclick={(e) => { e.stopPropagation(); onClose(); }}
				class="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur transition-all hover:bg-white/20"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				<span class="hidden sm:inline">Zurück</span>
			</button>

			<!-- Page Indicator -->
			<div class="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur">
				{pageIndicator}
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-2">
				{#if onToggleFavorite}
					<button
						onclick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20"
						title={story.is_favorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
					>
						<svg class="h-5 w-5" fill={story.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
					</button>
				{/if}
				<button
					onclick={(e) => { e.stopPropagation(); isFullscreen = !isFullscreen; }}
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20"
					title={isFullscreen ? 'Vollbild beenden (F)' : 'Vollbild (F)'}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if isFullscreen}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
						{/if}
					</svg>
				</button>
			</div>
		</header>
	{/if}

	<!-- Content -->
	<div class="flex flex-1 items-center justify-center overflow-hidden">
		{#if currentPage === -1}
			<!-- Start Screen -->
			<StoryStartScreen
				title={story.title}
				characterName={story.characterName}
				characterImage={story.characterImageUrl}
				onStart={nextPage}
			/>
		{:else if currentPage === story.pages.length}
			<!-- End Screen -->
			<StoryEndScreen
				{onClose}
				onRestart={restart}
				{onArchive}
			/>
		{:else}
			<!-- Story Page -->
			<StoryPageView
				page={story.pages[currentPage]}
				pageNumber={currentPage + 1}
				totalPages={story.pages.length}
			/>
		{/if}
	</div>

	<!-- Navigation Dots (hidden in fullscreen) -->
	{#if !isFullscreen}
		<footer class="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
			<div class="flex items-center justify-center gap-2">
				<!-- Start dot -->
				<button
					onclick={(e) => { e.stopPropagation(); goToPage(-1); }}
					class="h-2 rounded-full transition-all {currentPage === -1 ? 'w-4 bg-white' : 'w-2 bg-white/40'}"
					title="Titelseite"
				></button>

				<!-- Page dots -->
				{#each story.pages as _, index}
					<button
						onclick={(e) => { e.stopPropagation(); goToPage(index); }}
						class="h-2 rounded-full transition-all {currentPage === index ? 'w-4 bg-white' : 'w-2 bg-white/40'}"
						title="Seite {index + 1}"
					></button>
				{/each}

				<!-- End dot -->
				<button
					onclick={(e) => { e.stopPropagation(); goToPage(story.pages.length); }}
					class="h-2 rounded-full transition-all {currentPage === story.pages.length ? 'w-4 bg-white' : 'w-2 bg-white/40'}"
					title="Ende"
				></button>
			</div>

			<!-- Keyboard hints -->
			<p class="mt-2 text-center text-xs text-white/50">
				← → Navigation • Leertaste Weiter • F Vollbild • ESC Schließen
			</p>
		</footer>
	{/if}
</div>
