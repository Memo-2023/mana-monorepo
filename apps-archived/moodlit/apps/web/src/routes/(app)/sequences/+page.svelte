<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { sequencesStore } from '$lib/stores/sequences.svelte';
	import { DEFAULT_MOODS, getMoodById, getMoodGradient } from '$lib/data/default-moods';
	import { moodsStore } from '$lib/stores/moods.svelte';
	import { Play, Pause, Plus, Trash, Clock } from '@manacore/shared-icons';
	import type { MoodSequence, Mood } from '$lib/types/mood';
	import MoodFullscreen from '$lib/components/mood/MoodFullscreen.svelte';

	// Get mood by ID from both default and custom moods
	function getMood(moodId: string): Mood | undefined {
		return getMoodById(moodId) || moodsStore.customMoods.find((m) => m.id === moodId);
	}

	// Get sequence preview gradient (first 3 moods)
	function getSequenceGradient(sequence: MoodSequence): string {
		const colors = sequence.items.slice(0, 3).map((item) => {
			const mood = getMood(item.moodId);
			return mood?.colors[0] || '#8b5cf6';
		});
		return `linear-gradient(135deg, ${colors.join(', ')})`;
	}

	// Get total duration
	function getTotalDuration(sequence: MoodSequence): number {
		return sequence.items.reduce((sum, item) => sum + item.duration, 0);
	}

	// Format duration
	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
	}

	// Active sequence player state
	let showPlayer = $state(false);
	let playerMood = $state<Mood | null>(null);
	let sequenceInterval: ReturnType<typeof setInterval> | null = null;

	function playSequence(sequence: MoodSequence) {
		sequencesStore.playSequence(sequence);
		startPlayback();
	}

	function startPlayback() {
		if (!sequencesStore.activeSequence) return;

		const currentItem = sequencesStore.activeSequence.items[sequencesStore.currentItemIndex];
		const mood = getMood(currentItem.moodId);

		if (mood) {
			playerMood = mood;
			showPlayer = true;
		}

		// Clear any existing interval
		if (sequenceInterval) clearInterval(sequenceInterval);

		// Start timer for current item
		sequenceInterval = setInterval(() => {
			if (sequencesStore.isPlaying && sequencesStore.activeSequence) {
				sequencesStore.nextItem();
				const nextItem = sequencesStore.activeSequence.items[sequencesStore.currentItemIndex];
				const nextMood = getMood(nextItem.moodId);
				if (nextMood) {
					playerMood = nextMood;
				}
			}
		}, currentItem.duration * 1000);
	}

	function stopPlayback() {
		if (sequenceInterval) {
			clearInterval(sequenceInterval);
			sequenceInterval = null;
		}
		sequencesStore.stopSequence();
		showPlayer = false;
		playerMood = null;
	}

	function handlePlayerClose() {
		stopPlayback();
	}

	// Cleanup on unmount
	$effect(() => {
		return () => {
			if (sequenceInterval) clearInterval(sequenceInterval);
		};
	});
</script>

<div class="space-y-8">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">{$_('sequences.title')}</h1>
			<p class="text-muted-foreground mt-1">{$_('sequences.subtitle')}</p>
		</div>
	</header>

	<!-- Sequences Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each sequencesStore.sequences as sequence (sequence.id)}
			<div
				class="relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg"
			>
				<!-- Gradient Background -->
				<div class="aspect-video" style="background: {getSequenceGradient(sequence)};"></div>

				<!-- Overlay -->
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
				></div>

				<!-- Content -->
				<div class="absolute inset-0 p-4 flex flex-col justify-between">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-2 text-white/80 text-sm">
							<Clock size={16} />
							{formatDuration(getTotalDuration(sequence))}
						</div>
						{#if sequence.isCustom}
							<button
								type="button"
								class="p-1.5 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"
								onclick={() => sequencesStore.removeSequence(sequence.id)}
								aria-label="Delete sequence"
							>
								<Trash size={16} class="text-white" />
							</button>
						{/if}
					</div>

					<div class="flex items-end justify-between">
						<div>
							<h3 class="text-lg font-semibold text-white drop-shadow-md">
								{sequence.name}
							</h3>
							<p class="text-sm text-white/70">
								{sequence.items.length}
								{$_('sequences.moods')}
							</p>
						</div>

						<button
							type="button"
							class="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110"
							onclick={() => playSequence(sequence)}
							aria-label="Play sequence"
						>
							<Play size={24} class="text-white" />
						</button>
					</div>
				</div>

				<!-- Mood Preview Dots -->
				<div class="absolute bottom-16 left-4 flex gap-1">
					{#each sequence.items.slice(0, 5) as item}
						{@const mood = getMood(item.moodId)}
						{#if mood}
							<div
								class="w-4 h-4 rounded-full border-2 border-white/50"
								style="background: {mood.colors[0]};"
								title={mood.name}
							></div>
						{/if}
					{/each}
					{#if sequence.items.length > 5}
						<div
							class="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[8px] text-white font-bold"
						>
							+{sequence.items.length - 5}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if sequencesStore.sequences.length === 0}
		<section class="bg-muted/50 rounded-2xl p-8 text-center">
			<div class="max-w-md mx-auto">
				<div
					class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center"
				>
					<Plus size={32} class="text-primary" />
				</div>
				<h2 class="text-xl font-semibold mb-2">{$_('sequences.empty')}</h2>
				<p class="text-muted-foreground">{$_('sequences.emptyDescription')}</p>
			</div>
		</section>
	{/if}
</div>

<!-- Sequence Player (Fullscreen) -->
{#if showPlayer && playerMood}
	<MoodFullscreen
		mood={playerMood}
		isFavorite={moodsStore.isFavorite(playerMood.id)}
		onClose={handlePlayerClose}
		onFavoriteToggle={() => moodsStore.toggleFavorite(playerMood?.id || '')}
	/>
{/if}
