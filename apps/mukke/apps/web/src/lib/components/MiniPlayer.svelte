<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';

	let progress = $derived(
		playerStore.duration > 0 ? (playerStore.currentTime / playerStore.duration) * 100 : 0
	);

	function formatTime(s: number): string {
		if (!s || !isFinite(s)) return '0:00';
		return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
	}
</script>

{#if playerStore.currentSong}
	<div class="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border">
		<!-- Progress bar at top -->
		<div class="h-1 w-full bg-border">
			<div class="h-full bg-primary transition-all duration-200" style="width: {progress}%"></div>
		</div>

		<div class="flex items-center h-16 px-4 gap-3">
			<!-- Cover art placeholder -->
			<button
				onclick={() => playerStore.toggleFullPlayer()}
				class="flex items-center gap-3 flex-1 min-w-0"
			>
				<div class="w-12 h-12 rounded bg-background flex items-center justify-center shrink-0">
					<svg class="w-6 h-6 text-foreground-secondary" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
						/>
					</svg>
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
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z" />
						</svg>
					{/if}
				</button>

				<!-- Next -->
				<button
					onclick={() => playerStore.nextSong()}
					class="p-2 rounded-lg hover:bg-surface-hover transition-colors text-foreground-secondary"
					aria-label="Next track"
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
