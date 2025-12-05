<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { moodsStore } from '$lib/stores/moods.svelte';
	import { DEFAULT_MOODS, getMoodGradient } from '$lib/data/default-moods';
	import MoodCard from '$lib/components/mood/MoodCard.svelte';
	import MoodFullscreen from '$lib/components/mood/MoodFullscreen.svelte';
	import CreateMoodDialog from '$lib/components/mood/CreateMoodDialog.svelte';
	import { Plus } from '@manacore/shared-icons';
	import type { Mood, AnimationType } from '$lib/types/mood';

	// Combine default moods with custom moods
	let allMoods = $derived([...DEFAULT_MOODS, ...moodsStore.customMoods]);

	// Get favorites (moods that are in the favorites list)
	let favoriteMoods = $derived(allMoods.filter((m) => moodsStore.isFavorite(m.id)));

	// Filter by category
	let selectedCategory = $state<'all' | 'favorites' | 'custom'>('all');

	// Fullscreen state
	let showFullscreen = $state(false);
	let fullscreenMood = $state<Mood | null>(null);

	// Create mood dialog state
	let showCreateDialog = $state(false);

	let displayedMoods = $derived(() => {
		switch (selectedCategory) {
			case 'favorites':
				return favoriteMoods;
			case 'custom':
				return moodsStore.customMoods;
			default:
				return allMoods;
		}
	});

	function handleMoodClick(mood: Mood) {
		fullscreenMood = mood;
		showFullscreen = true;
		moodsStore.setActiveMood(mood);
	}

	function handleCloseFullscreen() {
		showFullscreen = false;
		moodsStore.setActiveMood(null);
	}

	function handleFavoriteToggle(mood: Mood) {
		moodsStore.toggleFavorite(mood.id);
	}

	function handleFullscreenFavoriteToggle() {
		if (fullscreenMood) {
			moodsStore.toggleFavorite(fullscreenMood.id);
		}
	}

	function handleCreateMood(moodData: {
		name: string;
		colors: string[];
		animationType: AnimationType;
	}) {
		const newMood: Mood = {
			id: `custom-${Date.now()}`,
			name: moodData.name,
			colors: moodData.colors,
			animationType: moodData.animationType,
			isCustom: true,
			order: moodsStore.customMoods.length,
			createdAt: new Date().toISOString(),
		};
		moodsStore.addMood(newMood);
	}
</script>

<div class="space-y-8">
	<!-- Header -->
	<header>
		<h1 class="text-3xl font-bold">{$_('home.title')}</h1>
		<p class="text-[hsl(var(--color-muted-foreground))] mt-1">{$_('home.subtitle')}</p>
	</header>

	<!-- Category Tabs -->
	<div class="flex gap-2">
		<button
			class="px-4 py-2 rounded-full text-sm font-medium transition-colors {selectedCategory ===
			'all'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted hover:bg-muted/80'}"
			onclick={() => (selectedCategory = 'all')}
		>
			{$_('home.all')}
		</button>
		<button
			class="px-4 py-2 rounded-full text-sm font-medium transition-colors {selectedCategory ===
			'favorites'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted hover:bg-muted/80'}"
			onclick={() => (selectedCategory = 'favorites')}
		>
			{$_('home.favorites')} ({favoriteMoods.length})
		</button>
		<button
			class="px-4 py-2 rounded-full text-sm font-medium transition-colors {selectedCategory ===
			'custom'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted hover:bg-muted/80'}"
			onclick={() => (selectedCategory = 'custom')}
		>
			{$_('home.custom')} ({moodsStore.customMoods.length})
		</button>
	</div>

	<!-- Fullscreen Mood View -->
	{#if showFullscreen && fullscreenMood}
		<MoodFullscreen
			mood={fullscreenMood}
			isFavorite={moodsStore.isFavorite(fullscreenMood.id)}
			onClose={handleCloseFullscreen}
			onFavoriteToggle={handleFullscreenFavoriteToggle}
		/>
	{/if}

	<!-- Mood Grid -->
	<section>
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
			{#each displayedMoods() as mood (mood.id)}
				<MoodCard
					{mood}
					isActive={moodsStore.activeMood?.id === mood.id}
					isFavorite={moodsStore.isFavorite(mood.id)}
					onClick={() => handleMoodClick(mood)}
					onFavoriteToggle={() => handleFavoriteToggle(mood)}
				/>
			{/each}
		</div>

		{#if displayedMoods().length === 0}
			<div class="text-center py-12 text-muted-foreground">
				{#if selectedCategory === 'favorites'}
					<p>No favorites yet. Click the heart icon on a mood to add it to favorites.</p>
				{:else if selectedCategory === 'custom'}
					<p>No custom moods yet. Create your own mood to get started.</p>
				{:else}
					<p>No moods available.</p>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Sequences Section -->
	<section class="border-t border-border pt-8">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">{$_('home.sequences')}</h2>
			<a href="/sequences" class="text-sm text-primary hover:underline"> View all </a>
		</div>
		<p class="text-muted-foreground">{$_('home.sequencesDescription')}</p>
	</section>
</div>

<!-- Floating Action Button -->
<button
	type="button"
	class="fixed bottom-24 right-6 z-30 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-110 transition-all"
	onclick={() => (showCreateDialog = true)}
	aria-label={$_('createMood.title')}
>
	<Plus size={24} />
</button>

<!-- Create Mood Dialog -->
<CreateMoodDialog
	isOpen={showCreateDialog}
	onClose={() => (showCreateDialog = false)}
	onSave={handleCreateMood}
/>
