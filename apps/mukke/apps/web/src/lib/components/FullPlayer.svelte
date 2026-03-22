<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import VisualizerRenderer from '$lib/visualizer/VisualizerRenderer.svelte';

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

	function repeatIcon(mode: string): string {
		if (mode === 'one') return '1';
		return '';
	}
</script>

{#if playerStore.showFullPlayer && playerStore.currentSong}
	<div class="fixed inset-0 z-50 bg-background flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4">
			<button
				onclick={() => playerStore.toggleFullPlayer()}
				class="p-2 rounded-lg hover:bg-surface-hover transition-colors text-foreground-secondary"
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
			<div class="text-sm text-foreground-secondary">Now Playing</div>
			<div class="w-10"></div>
		</div>

		<!-- Content -->
		<div class="flex-1 flex flex-col items-center justify-center px-8 gap-8">
			<!-- Cover art -->
			<div class="w-64 h-64 rounded-2xl bg-surface flex items-center justify-center shadow-lg">
				<svg class="w-24 h-24 text-foreground-secondary" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
					/>
				</svg>
			</div>

			<!-- Visualizer -->
			<div class="w-full max-w-md">
				<VisualizerRenderer height={200} showSwitcher={true} />
			</div>

			<!-- Song info -->
			<div class="text-center w-full max-w-md">
				<div class="text-xl font-bold text-foreground truncate">
					{playerStore.currentSong.title}
				</div>
				<div class="text-foreground-secondary mt-1 truncate">
					{playerStore.currentSong.artist || 'Unknown Artist'}
				</div>
				{#if playerStore.currentSong.album}
					<div class="text-sm text-foreground-secondary mt-0.5 truncate">
						{playerStore.currentSong.album}
					</div>
				{/if}
			</div>

			<!-- Progress bar -->
			<div class="w-full max-w-md">
				<button
					class="w-full h-2 bg-border rounded-full cursor-pointer relative block"
					onclick={handleProgressClick}
					aria-label="Seek"
				>
					<div
						class="h-full bg-primary rounded-full transition-all duration-100"
						style="width: {progress}%"
					></div>
					<div
						class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow"
						style="left: {progress}%"
					></div>
				</button>
				<div class="flex justify-between mt-2 text-xs text-foreground-secondary">
					<span>{formatTime(playerStore.currentTime)}</span>
					<span>{formatTime(playerStore.duration)}</span>
				</div>
			</div>

			<!-- Transport controls -->
			<div class="flex items-center gap-6">
				<!-- Previous -->
				<button
					onclick={() => playerStore.previousSong()}
					class="p-3 rounded-full hover:bg-surface-hover transition-colors text-foreground"
					aria-label="Previous track"
				>
					<svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
					</svg>
				</button>

				<!-- Play/Pause -->
				<button
					onclick={() => playerStore.togglePlay()}
					class="p-4 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors"
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
					class="p-3 rounded-full hover:bg-surface-hover transition-colors text-foreground"
					aria-label="Next track"
				>
					<svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
					</svg>
				</button>
			</div>

			<!-- Bottom row: Shuffle, Repeat, Volume, Queue -->
			<div class="flex items-center gap-6 w-full max-w-md justify-center">
				<!-- Shuffle -->
				<button
					onclick={() => playerStore.toggleShuffle()}
					class="p-2 rounded-lg transition-colors {playerStore.shuffleOn
						? 'text-primary'
						: 'text-foreground-secondary hover:text-foreground'}"
					aria-label="Toggle shuffle"
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
						/>
					</svg>
				</button>

				<!-- Repeat -->
				<button
					onclick={() => playerStore.toggleRepeat()}
					class="p-2 rounded-lg transition-colors relative {playerStore.repeatMode !== 'off'
						? 'text-primary'
						: 'text-foreground-secondary hover:text-foreground'}"
					aria-label="Toggle repeat ({playerStore.repeatMode})"
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
					</svg>
					{#if playerStore.repeatMode === 'one'}
						<span
							class="absolute -top-1 -right-1 text-[10px] font-bold bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center"
							>1</span
						>
					{/if}
				</button>

				<!-- Volume -->
				<div class="flex items-center gap-2">
					<svg
						class="w-5 h-5 text-foreground-secondary shrink-0"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
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
						class="w-20 h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
					/>
				</div>

				<!-- Queue -->
				<button
					onclick={() => playerStore.toggleQueue()}
					class="p-2 rounded-lg transition-colors {playerStore.showQueue
						? 'text-primary'
						: 'text-foreground-secondary hover:text-foreground'}"
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
{/if}
