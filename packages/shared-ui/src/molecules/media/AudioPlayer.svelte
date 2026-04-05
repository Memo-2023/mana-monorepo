<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { Text } from '../../atoms';
	import { Pause, Play, SkipBack, SkipForward } from '@mana/shared-icons';

	interface Props {
		/** Audio source URL */
		src: string;
		/** Optional known duration (seconds) */
		duration?: number;
		/** Custom play icon snippet */
		playIcon?: Snippet;
		/** Custom pause icon snippet */
		pauseIcon?: Snippet;
		/** Custom skip back icon snippet */
		skipBackIcon?: Snippet;
		/** Custom skip forward icon snippet */
		skipForwardIcon?: Snippet;
	}

	let { src, duration, playIcon, pauseIcon, skipBackIcon, skipForwardIcon }: Props = $props();

	let audio: HTMLAudioElement;
	let currentTime = $state(0);
	let audioDuration = $state(duration || 0);
	let isPlaying = $state(false);
	let isLoading = $state(true);
	let playbackRate = $state(1.0);

	onMount(() => {
		if (audio) {
			audio.addEventListener('loadedmetadata', () => {
				audioDuration = audio.duration;
				isLoading = false;
			});

			audio.addEventListener('timeupdate', () => {
				currentTime = audio.currentTime;
			});

			audio.addEventListener('ended', () => {
				isPlaying = false;
				currentTime = 0;
			});

			audio.addEventListener('error', () => {
				isLoading = false;
			});
		}
	});

	function togglePlay() {
		if (!audio) return;

		if (isPlaying) {
			audio.pause();
		} else {
			audio.play();
		}
		isPlaying = !isPlaying;
	}

	function seek(e: Event) {
		if (!audio) return;
		const input = e.target as HTMLInputElement;
		audio.currentTime = parseFloat(input.value);
	}

	function changePlaybackRate() {
		if (!audio) return;
		const rates = [1.0, 1.25, 1.5, 1.75, 2.0];
		const currentIndex = rates.indexOf(playbackRate);
		const nextIndex = (currentIndex + 1) % rates.length;
		playbackRate = rates[nextIndex];
		audio.playbackRate = playbackRate;
	}

	function formatTime(seconds: number) {
		if (isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function skipForward() {
		if (!audio) return;
		audio.currentTime = Math.min(audio.currentTime + 10, audioDuration);
	}

	function skipBackward() {
		if (!audio) return;
		audio.currentTime = Math.max(audio.currentTime - 10, 0);
	}

	// Calculate progress percentage for styling
	const progressPercent = $derived(audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0);
</script>

<div class="rounded-2xl border border-theme bg-content p-4">
	<audio bind:this={audio} {src} preload="metadata"></audio>

	<!-- Progress Bar -->
	<div class="mb-4">
		<input
			type="range"
			min="0"
			max={audioDuration || 100}
			value={currentTime}
			oninput={seek}
			class="audio-slider w-full"
			style="--progress: {progressPercent}%"
			disabled={isLoading}
		/>
		<div class="mt-1 flex justify-between">
			<Text variant="muted">{formatTime(currentTime)}</Text>
			<Text variant="muted">{formatTime(audioDuration)}</Text>
		</div>
	</div>

	<!-- Controls -->
	<div class="flex items-center justify-center gap-4">
		<!-- Skip Backward -->
		<button
			onclick={skipBackward}
			disabled={isLoading}
			class="rounded-full bg-secondary-button p-2 transition-colors hover:bg-content-hover disabled:opacity-50"
			type="button"
			aria-label="Skip backward 10 seconds"
		>
			{#if skipBackIcon}
				{@render skipBackIcon()}
			{:else}
				<SkipForward size={20} class="text-theme" />
			{/if}
		</button>

		<!-- Play/Pause -->
		<button
			onclick={togglePlay}
			disabled={isLoading}
			class="rounded-full bg-primary-button p-4 text-primary-button-text transition-colors hover:opacity-90 disabled:opacity-50"
			type="button"
			aria-label={isPlaying ? 'Pause' : 'Play'}
		>
			{#if isLoading}
				<svg class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else if isPlaying}
				{#if pauseIcon}
					{@render pauseIcon()}
				{:else}
					<Pause size={20} weight="fill" />
				{/if}
			{:else if playIcon}
				{@render playIcon()}
			{:else}
				<Play size={20} weight="fill" />
			{/if}
		</button>

		<!-- Skip Forward -->
		<button
			onclick={skipForward}
			disabled={isLoading}
			class="rounded-full bg-secondary-button p-2 transition-colors hover:bg-content-hover disabled:opacity-50"
			type="button"
			aria-label="Skip forward 10 seconds"
		>
			{#if skipForwardIcon}
				{@render skipForwardIcon()}
			{:else}
				<SkipBack size={20} class="text-theme" />
			{/if}
		</button>

		<!-- Playback Speed -->
		<button
			onclick={changePlaybackRate}
			disabled={isLoading}
			class="rounded-lg bg-secondary-button px-3 py-1 text-sm font-medium text-theme transition-colors hover:bg-content-hover disabled:opacity-50"
			type="button"
			aria-label="Change playback speed"
		>
			{playbackRate}x
		</button>
	</div>
</div>

<style>
	/* Custom Range Slider Styling */
	.audio-slider {
		-webkit-appearance: none;
		appearance: none;
		height: 8px;
		border-radius: 4px;
		background: transparent;
		outline: none;
		cursor: pointer;
		position: relative;
	}

	.audio-slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Webkit (Chrome, Safari, Edge) - Track */
	.audio-slider::-webkit-slider-runnable-track {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(
			to right,
			var(--color-primary-button) 0%,
			var(--color-primary-button) var(--progress, 0%),
			var(--color-border) var(--progress, 0%),
			var(--color-border) 100%
		);
	}

	/* Webkit - Thumb */
	.audio-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-primary-button);
		cursor: pointer;
		border: 3px solid var(--color-content-bg);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		margin-top: -6px;
		transition: transform 0.1s ease;
	}

	.audio-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.audio-slider::-webkit-slider-thumb:active {
		transform: scale(1.1);
	}

	/* Firefox - Track */
	.audio-slider::-moz-range-track {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: var(--color-border);
	}

	/* Firefox - Progress */
	.audio-slider::-moz-range-progress {
		height: 8px;
		border-radius: 4px;
		background: var(--color-primary-button);
	}

	/* Firefox - Thumb */
	.audio-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--color-primary-button);
		cursor: pointer;
		border: 3px solid var(--color-content-bg);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.1s ease;
	}

	.audio-slider::-moz-range-thumb:hover {
		transform: scale(1.15);
	}

	.audio-slider::-moz-range-thumb:active {
		transform: scale(1.1);
	}
</style>
