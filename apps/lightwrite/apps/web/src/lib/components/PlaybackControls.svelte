<script lang="ts">
	import { audioStore } from '$lib/stores/audio.svelte';
	import { editorStore } from '$lib/stores/editor.svelte';
	import { formatTime } from '$lib/utils/time-format';

	interface Props {
		onPlay?: () => void;
		onPause?: () => void;
		onSeek?: (time: number) => void;
		onZoomIn?: () => void;
		onZoomOut?: () => void;
		compact?: boolean;
	}

	let { onPlay, onPause, onSeek, onZoomIn, onZoomOut, compact = false }: Props = $props();

	function handlePlayPause() {
		if (audioStore.isPlaying) {
			onPause?.();
		} else {
			onPlay?.();
		}
	}

	function handleSeek(e: Event) {
		const input = e.target as HTMLInputElement;
		const time = parseFloat(input.value);
		onSeek?.(time);
	}

	function skipBackward() {
		const newTime = Math.max(0, audioStore.currentTime - 5);
		onSeek?.(newTime);
	}

	function skipForward() {
		const newTime = Math.min(audioStore.duration, audioStore.currentTime + 5);
		onSeek?.(newTime);
	}
</script>

{#if compact}
	<!-- Compact mobile layout -->
	<div class="flex items-center gap-2 p-2 bg-surface rounded-lg">
		<!-- Play/Pause button -->
		<button
			onclick={handlePlayPause}
			class="p-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors shrink-0"
			aria-label={audioStore.isPlaying ? 'Pause' : 'Play'}
		>
			{#if audioStore.isPlaying}
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
				</svg>
			{:else}
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M8 5v14l11-7z" />
				</svg>
			{/if}
		</button>

		<!-- Time display -->
		<div class="text-xs font-mono text-foreground-secondary shrink-0">
			{formatTime(audioStore.currentTime)}
		</div>

		<!-- Seek slider -->
		<div class="flex-1">
			<input
				type="range"
				min="0"
				max={audioStore.duration || 100}
				step="0.1"
				value={audioStore.currentTime}
				oninput={handleSeek}
				class="w-full h-1.5 bg-surface-hover rounded-lg appearance-none cursor-pointer"
			/>
		</div>

		<!-- Duration -->
		<div class="text-xs font-mono text-foreground-secondary shrink-0">
			{formatTime(audioStore.duration)}
		</div>

		<!-- BPM display (compact) -->
		{#if audioStore.bpm}
			<div class="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium shrink-0">
				{audioStore.bpm}
			</div>
		{/if}
	</div>
{:else}
	<!-- Desktop layout -->
	<div class="flex items-center gap-4 p-4 bg-surface rounded-lg">
		<!-- Time display -->
		<div class="text-sm font-mono text-foreground-secondary min-w-[100px]">
			{formatTime(audioStore.currentTime)} / {formatTime(audioStore.duration)}
		</div>

		<!-- Playback controls -->
		<div class="flex items-center gap-2">
			<button
				onclick={skipBackward}
				class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
				aria-label="Skip backward 5 seconds"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
					/>
				</svg>
			</button>

			<button
				onclick={handlePlayPause}
				class="p-3 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors"
				aria-label={audioStore.isPlaying ? 'Pause' : 'Play'}
			>
				{#if audioStore.isPlaying}
					<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
					</svg>
				{:else}
					<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z" />
					</svg>
				{/if}
			</button>

			<button
				onclick={skipForward}
				class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
				aria-label="Skip forward 5 seconds"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
					/>
				</svg>
			</button>
		</div>

		<!-- Seek slider -->
		<div class="flex-1">
			<input
				type="range"
				min="0"
				max={audioStore.duration || 100}
				step="0.1"
				value={audioStore.currentTime}
				oninput={handleSeek}
				class="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer"
			/>
		</div>

		<!-- Zoom controls -->
		<div class="flex items-center gap-1">
			<button
				onclick={onZoomOut}
				class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
				aria-label="Zoom out"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
					/>
				</svg>
			</button>
			<span class="text-xs text-foreground-secondary min-w-[40px] text-center">
				{Math.round(editorStore.zoom * 100)}%
			</span>
			<button
				onclick={onZoomIn}
				class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
				aria-label="Zoom in"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
					/>
				</svg>
			</button>
		</div>

		<!-- BPM display -->
		{#if audioStore.bpm}
			<div class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
				{audioStore.bpm} BPM
			</div>
		{/if}
	</div>
{/if}
