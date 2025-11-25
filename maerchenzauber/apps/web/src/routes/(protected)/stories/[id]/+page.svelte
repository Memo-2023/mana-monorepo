<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { dataService } from '$lib/api/dataService';
	import type { Story } from '$lib/types/story';
	import StoryViewer from '$lib/components/story/StoryViewer.svelte';

	let story = $state<Story | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Get story ID from route params
	let storyId = $derived($page.params.id);

	// Fetch story data
	async function loadStory() {
		if (!storyId) return;

		loading = true;
		error = null;

		try {
			story = await dataService.getStoryById(storyId);
		} catch (err) {
			console.error('[StoryReader] Failed to load story:', err);
			error = err instanceof Error ? err.message : 'Geschichte konnte nicht geladen werden';
		} finally {
			loading = false;
		}
	}

	// Load story when ID changes
	$effect(() => {
		if (storyId) {
			loadStory();
		}
	});

	// Handle close - go back to stories list
	function handleClose() {
		goto('/stories');
	}

	// Handle archive
	async function handleArchive() {
		if (!story) return;

		try {
			await dataService.updateStory(story.id, { archived: true });
			goto('/stories');
		} catch (err) {
			console.error('[StoryReader] Failed to archive story:', err);
		}
	}

	// Handle favorite toggle
	async function handleToggleFavorite() {
		if (!story) return;

		const newFavoriteState = !story.is_favorite;

		try {
			await dataService.toggleFavorite(story.id, newFavoriteState);
			// Update local state
			story = { ...story, is_favorite: newFavoriteState };
		} catch (err) {
			console.error('[StoryReader] Failed to toggle favorite:', err);
		}
	}
</script>

<svelte:head>
	<title>{story?.title || 'Geschichte laden...'} - Märchenzauber</title>
</svelte:head>

{#if loading}
	<!-- Loading State -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
		<div class="flex flex-col items-center gap-4">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
			<p class="text-lg text-white">Geschichte wird geladen...</p>
		</div>
	</div>
{:else if error}
	<!-- Error State -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 p-4">
		<div class="max-w-md rounded-2xl bg-white/10 p-8 text-center backdrop-blur">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mx-auto">
				<svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<h2 class="mb-2 text-xl font-bold text-white">Fehler beim Laden</h2>
			<p class="mb-6 text-white/70">{error}</p>
			<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<button
					onclick={loadStory}
					class="rounded-xl bg-pink-500 px-6 py-3 font-medium text-white transition-colors hover:bg-pink-600"
				>
					Erneut versuchen
				</button>
				<button
					onclick={handleClose}
					class="rounded-xl bg-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/20"
				>
					Zurück zur Übersicht
				</button>
			</div>
		</div>
	</div>
{:else if story}
	<!-- Story Viewer -->
	<StoryViewer
		{story}
		onClose={handleClose}
		onArchive={handleArchive}
		onToggleFavorite={handleToggleFavorite}
	/>
{/if}
