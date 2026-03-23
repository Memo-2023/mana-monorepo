<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import VisualizerRenderer from '$lib/visualizer/VisualizerRenderer.svelte';
	import { visualizerStore } from '$lib/visualizer/registry.svelte';

	let innerHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 800);

	let progress = $derived(
		playerStore.duration > 0 ? (playerStore.currentTime / playerStore.duration) * 100 : 0
	);

	function formatTime(s: number): string {
		if (!s || !isFinite(s)) return '0:00';
		return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
	}

	function handleProgressClick(e: MouseEvent) {
		const bar = e.currentTarget as HTMLElement;
		const rect = bar.getBoundingClientRect();
		const fraction = (e.clientX - rect.left) / rect.width;
		const time = fraction * playerStore.duration;
		playerStore.seekTo(time);
	}

	function handleVolumeInput(e: Event) {
		const input = e.target as HTMLInputElement;
		playerStore.setVolume(parseFloat(input.value));
	}
</script>

<svelte:window bind:innerHeight />

{#if playerStore.showFullPlayer && playerStore.currentSong}
	<div class="full-player">
		<!-- Visualizer as full background -->
		<div class="viz-background">
			<VisualizerRenderer height={innerHeight} showSwitcher={false} />
		</div>

		<!-- Dark overlay for readability -->
		<div class="viz-overlay"></div>

		<!-- Content layer -->
		<div class="content-layer">
			<!-- Top bar -->
			<div class="flex items-center justify-between p-4">
				<button
					onclick={() => playerStore.toggleFullPlayer()}
					class="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors text-white"
					aria-label="Close player"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				<div class="text-sm text-white/70">Now Playing</div>
				<!-- Visualizer switcher -->
				<div class="flex gap-1">
					{#each visualizerStore.all as viz}
						<button
							onclick={() => visualizerStore.setActive(viz.id)}
							class="px-2 py-1 text-xs rounded-md transition-colors {visualizerStore.active ===
							viz.id
								? 'bg-white/30 text-white'
								: 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'}"
							title={viz.description}
						>
							{viz.name}
						</button>
					{/each}
				</div>
			</div>

			<!-- Spacer to push controls to bottom -->
			<div class="flex-1"></div>

			<!-- Song info + controls at bottom -->
			<div class="p-6 pb-8 flex flex-col gap-5 max-w-lg mx-auto w-full">
				<!-- Song info -->
				<div class="text-center">
					<div class="text-2xl font-bold text-white truncate">
						{playerStore.currentSong.title}
					</div>
					<div class="text-white/70 mt-1 truncate">
						{playerStore.currentSong.artist || 'Unknown Artist'}
					</div>
					{#if playerStore.currentSong.album}
						<div class="text-sm text-white/50 mt-0.5 truncate">
							{playerStore.currentSong.album}
						</div>
					{/if}
				</div>

				<!-- Progress bar -->
				<div class="w-full">
					<button
						class="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative block"
						onclick={handleProgressClick}
						aria-label="Seek"
					>
						<div
							class="h-full bg-white rounded-full transition-all duration-100"
							style="width: {progress}%"
						></div>
						<div
							class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
							style="left: {progress}%"
						></div>
					</button>
					<div class="flex justify-between mt-1.5 text-xs text-white/50">
						<span>{formatTime(playerStore.currentTime)}</span>
						<span>{formatTime(playerStore.duration)}</span>
					</div>
				</div>

				<!-- Transport controls -->
				<div class="flex items-center justify-center gap-8">
					<!-- Shuffle -->
					<button
						onclick={() => playerStore.toggleShuffle()}
						class="p-2 rounded-lg transition-colors {playerStore.shuffleOn
							? 'text-white'
							: 'text-white/40 hover:text-white/70'}"
						aria-label="Toggle shuffle"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
							/>
						</svg>
					</button>

					<!-- Previous -->
					<button
						onclick={() => playerStore.previousSong()}
						class="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
						aria-label="Previous track"
					>
						<svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
						</svg>
					</button>

					<!-- Play/Pause -->
					<button
						onclick={() => playerStore.togglePlay()}
						class="p-4 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
						aria-label={playerStore.isPlaying ? 'Pause' : 'Play'}
					>
						{#if playerStore.isPlaying}
							<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
								<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
							</svg>
						{:else}
							<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
								<path d="M8 5v14l11-7z" />
							</svg>
						{/if}
					</button>

					<!-- Next -->
					<button
						onclick={() => playerStore.nextSong()}
						class="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
						aria-label="Next track"
					>
						<svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
						</svg>
					</button>

					<!-- Repeat -->
					<button
						onclick={() => playerStore.toggleRepeat()}
						class="p-2 rounded-lg transition-colors relative {playerStore.repeatMode !== 'off'
							? 'text-white'
							: 'text-white/40 hover:text-white/70'}"
						aria-label="Toggle repeat ({playerStore.repeatMode})"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
						</svg>
						{#if playerStore.repeatMode === 'one'}
							<span
								class="absolute -top-1 -right-1 text-[10px] font-bold bg-white text-black rounded-full w-4 h-4 flex items-center justify-center"
								>1</span
							>
						{/if}
					</button>
				</div>

				<!-- Volume + Queue row -->
				<div class="flex items-center justify-center gap-4">
					<svg class="w-4 h-4 text-white/50 shrink-0" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
						/>
					</svg>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={playerStore.volume}
						oninput={handleVolumeInput}
						class="volume-slider"
					/>
					<button
						onclick={() => playerStore.toggleQueue()}
						class="p-2 rounded-lg transition-colors {playerStore.showQueue
							? 'text-white'
							: 'text-white/40 hover:text-white/70'}"
						aria-label="Toggle queue"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.full-player {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: #000;
		display: flex;
		flex-direction: column;
	}

	.viz-background {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	/* Make the visualizer fill the entire background */
	.viz-background :global(.relative.w-full) {
		height: 100% !important;
		width: 100% !important;
	}

	.viz-background :global(canvas) {
		height: 100% !important;
		width: 100% !important;
		border-radius: 0 !important;
	}

	.viz-background :global(div[aria-hidden='true']) {
		height: 100% !important;
	}

	.viz-overlay {
		position: absolute;
		inset: 0;
		z-index: 1;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0.3) 0%,
			rgba(0, 0, 0, 0.1) 40%,
			rgba(0, 0, 0, 0.4) 70%,
			rgba(0, 0, 0, 0.85) 100%
		);
		pointer-events: none;
	}

	.content-layer {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.volume-slider {
		width: 5rem;
		height: 4px;
		border-radius: 2px;
		appearance: none;
		background: rgba(255, 255, 255, 0.2);
		cursor: pointer;
	}

	.volume-slider::-webkit-slider-thumb {
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
	}

	.volume-slider::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
	}
</style>
