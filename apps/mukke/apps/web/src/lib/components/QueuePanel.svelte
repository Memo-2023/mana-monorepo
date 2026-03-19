<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';

	function formatTime(s: number | null): string {
		if (!s || !isFinite(s)) return '0:00';
		return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
	}
</script>

{#if playerStore.showQueue}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-40 bg-black/30"
		onclick={() => playerStore.toggleQueue()}
		aria-label="Close queue"
	></button>

	<!-- Panel -->
	<div
		class="fixed top-0 right-0 bottom-0 w-80 z-40 bg-surface border-l border-border flex flex-col shadow-xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-border">
			<h2 class="text-lg font-semibold text-foreground">Queue</h2>
			<button
				onclick={() => playerStore.toggleQueue()}
				class="p-2 rounded-lg hover:bg-surface-hover transition-colors text-foreground-secondary"
				aria-label="Close queue"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Song list -->
		<div class="flex-1 overflow-y-auto">
			{#if playerStore.queue.length === 0}
				<div class="p-4 text-center text-foreground-secondary text-sm">Queue is empty</div>
			{:else}
				{#each playerStore.queue as song, index}
					<div
						class="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors {index ===
						playerStore.currentIndex
							? 'bg-primary/10'
							: ''}"
					>
						<!-- Playing indicator or index -->
						<div class="w-6 text-center shrink-0">
							{#if index === playerStore.currentIndex}
								<div class="flex items-center justify-center gap-0.5">
									<span class="w-0.5 h-3 bg-primary rounded-full animate-pulse"></span>
									<span
										class="w-0.5 h-4 bg-primary rounded-full animate-pulse"
										style="animation-delay: 0.15s"
									></span>
									<span
										class="w-0.5 h-2 bg-primary rounded-full animate-pulse"
										style="animation-delay: 0.3s"
									></span>
								</div>
							{:else}
								<span class="text-xs text-foreground-secondary">{index + 1}</span>
							{/if}
						</div>

						<!-- Song info (clickable) -->
						<button
							class="flex-1 min-w-0 text-left"
							onclick={() => playerStore.playSong(song, playerStore.queue, index)}
						>
							<div
								class="text-sm truncate {index === playerStore.currentIndex
									? 'text-primary font-medium'
									: 'text-foreground'}"
							>
								{song.title}
							</div>
							<div class="text-xs text-foreground-secondary truncate">
								{song.artist || 'Unknown Artist'}
								{#if song.duration}
									<span class="ml-1">- {formatTime(song.duration)}</span>
								{/if}
							</div>
						</button>

						<!-- Remove button (not for current song) -->
						{#if index !== playerStore.currentIndex}
							<button
								onclick={() => playerStore.removeFromQueue(index)}
								class="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground shrink-0"
								aria-label="Remove from queue"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
