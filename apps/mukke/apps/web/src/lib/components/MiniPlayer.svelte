<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import FrequencyBars from '$lib/visualizer/FrequencyBars.svelte';
	import { MusicNote, Pause, Play, X } from '@manacore/shared-icons';

	let progress = $derived(
		playerStore.duration > 0 ? (playerStore.currentTime / playerStore.duration) * 100 : 0
	);

	function formatTime(s: number): string {
		if (!s || !isFinite(s)) return '0:00';
		return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
	}
</script>

{#if playerStore.currentSong}
	<div
		class="mini-player fixed left-0 right-0 z-30 bg-surface border-t border-border rounded-t-xl shadow-lg"
	>
		<!-- Error toast -->
		{#if playerStore.error}
			<div
				class="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-sm text-red-500"
			>
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span class="truncate">{playerStore.error}</span>
				<button
					onclick={() => playerStore.clearError()}
					class="ml-auto p-0.5 hover:text-red-400 shrink-0"
					aria-label="Dismiss error"
				>
					<X size={16} />
				</button>
			</div>
		{/if}

		<!-- Frequency visualizer + progress bar -->
		<div class="relative">
			<div class="opacity-40">
				<FrequencyBars barCount={64} height={20} barGap={1} barRadius={1} />
			</div>
			<div class="absolute bottom-0 left-0 right-0 h-1 bg-border">
				<div class="h-full bg-primary transition-all duration-200" style="width: {progress}%"></div>
			</div>
		</div>

		<div class="flex items-center h-16 px-4 gap-3">
			<!-- Cover art placeholder -->
			<button
				onclick={() => playerStore.toggleFullPlayer()}
				class="flex items-center gap-3 flex-1 min-w-0"
			>
				<div class="w-12 h-12 rounded bg-background flex items-center justify-center shrink-0">
					<MusicNote size={24} weight="fill" class="text-foreground-secondary" />
				</div>

				<!-- Song info -->
				<div class="min-w-0">
					<div class="text-sm font-medium text-foreground truncate">
						{playerStore.currentSong.title}
					</div>
					<div class="text-xs text-foreground-secondary truncate">
						{playerStore.currentSong.artist || 'Unknown Artist'}
					</div>
				</div>
			</button>

			<!-- Controls -->
			<div class="flex items-center gap-2 shrink-0">
				<!-- Play/Pause -->
				<button
					onclick={() => playerStore.togglePlay()}
					class="p-2 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors"
					aria-label={playerStore.isPlaying ? 'Pause' : 'Play'}
				>
					{#if playerStore.isPlaying}
						<Pause size={20} weight="fill" />
					{:else}
						<Play size={20} weight="fill" />
					{/if}
				</button>

				<!-- Next -->
				<button
					onclick={() => playerStore.nextSong()}
					class="p-2 rounded-lg hover:bg-surface-hover transition-colors text-foreground-secondary"
					aria-label="Next track"
				>
					<Play size={20} weight="fill" />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.mini-player {
		bottom: calc(80px + env(safe-area-inset-bottom, 0px));
	}
</style>
