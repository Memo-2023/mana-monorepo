<script lang="ts">
	import { audioPlayerStore } from '$lib/stores/audio-player.svelte';
	import FrequencyBars from './FrequencyBars.svelte';
	import {
		Play,
		Pause,
		SkipForward,
		SkipBack,
		X,
		FileAudio,
		SpeakerHigh,
		SpeakerLow,
		SpeakerNone,
	} from '@manacore/shared-icons';

	let innerHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 800);

	let progress = $derived(
		audioPlayerStore.duration > 0
			? (audioPlayerStore.currentTime / audioPlayerStore.duration) * 100
			: 0
	);

	function formatTime(s: number): string {
		if (!s || !isFinite(s)) return '0:00';
		return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
	}

	function handleProgressClick(e: MouseEvent) {
		const bar = e.currentTarget as HTMLElement;
		const rect = bar.getBoundingClientRect();
		const fraction = (e.clientX - rect.left) / rect.width;
		const time = fraction * audioPlayerStore.duration;
		audioPlayerStore.seekTo(time);
	}

	function handleVolumeInput(e: Event) {
		const input = e.target as HTMLInputElement;
		audioPlayerStore.setVolume(parseFloat(input.value));
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			audioPlayerStore.toggleFullPlayer();
		} else if (e.key === ' ') {
			e.preventDefault();
			audioPlayerStore.togglePlay();
		} else if (e.key === 'ArrowLeft') {
			audioPlayerStore.seekTo(Math.max(0, audioPlayerStore.currentTime - 5));
		} else if (e.key === 'ArrowRight') {
			audioPlayerStore.seekTo(
				Math.min(audioPlayerStore.duration, audioPlayerStore.currentTime + 5)
			);
		}
	}

	let VolumeIcon = $derived(
		audioPlayerStore.volume === 0
			? SpeakerNone
			: audioPlayerStore.volume < 0.5
				? SpeakerLow
				: SpeakerHigh
	);
</script>

<svelte:window bind:innerHeight />

{#if audioPlayerStore.showFullPlayer && audioPlayerStore.currentFile}
	<div
		class="full-player"
		role="dialog"
		aria-modal="true"
		aria-label="Audio Player"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<!-- Visualizer background -->
		<div class="viz-background">
			<FrequencyBars barCount={96} height={innerHeight} barGap={2} barRadius={3} mirror={true} />
		</div>

		<!-- Dark overlay -->
		<div class="viz-overlay"></div>

		<!-- Content -->
		<div class="content-layer">
			<!-- Top bar -->
			<div class="top-bar">
				<button
					class="top-btn"
					onclick={() => audioPlayerStore.toggleFullPlayer()}
					aria-label="Schließen"
				>
					<X size={24} />
				</button>
				<div class="now-playing">Wird abgespielt</div>
				<div style="width: 40px"></div>
			</div>

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- File info + controls -->
			<div class="bottom-section">
				<!-- Icon + File info -->
				<div class="file-hero">
					<div class="file-hero-icon">
						<FileAudio size={48} />
					</div>
					<div class="file-hero-name">{audioPlayerStore.currentFile.name}</div>
					<div class="file-hero-type">{audioPlayerStore.currentFile.mimeType}</div>
				</div>

				<!-- Progress bar -->
				<div class="progress-section">
					<button class="progress-bar" onclick={handleProgressClick} aria-label="Seek">
						<div class="progress-bar-fill" style="width: {progress}%"></div>
						<div class="progress-bar-thumb" style="left: {progress}%"></div>
					</button>
					<div class="progress-times">
						<span>{formatTime(audioPlayerStore.currentTime)}</span>
						<span>{formatTime(audioPlayerStore.duration)}</span>
					</div>
				</div>

				<!-- Transport controls -->
				<div class="transport">
					<button
						class="transport-btn"
						onclick={() => audioPlayerStore.previousTrack()}
						aria-label="Vorheriger Track"
					>
						<SkipBack size={28} weight="fill" />
					</button>

					<button
						class="transport-btn play"
						onclick={() => audioPlayerStore.togglePlay()}
						aria-label={audioPlayerStore.isPlaying ? 'Pause' : 'Abspielen'}
					>
						{#if audioPlayerStore.isPlaying}
							<Pause size={32} weight="fill" />
						{:else}
							<Play size={32} weight="fill" />
						{/if}
					</button>

					<button
						class="transport-btn"
						onclick={() => audioPlayerStore.nextTrack()}
						aria-label="Nächster Track"
					>
						<SkipForward size={28} weight="fill" />
					</button>
				</div>

				<!-- Volume -->
				<div class="volume-row">
					<VolumeIcon size={18} />
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={audioPlayerStore.volume}
						oninput={handleVolumeInput}
						class="volume-slider"
						aria-label="Lautstärke"
					/>
				</div>

				<!-- Queue info -->
				{#if audioPlayerStore.queue.length > 1}
					<div class="queue-info">
						Track {audioPlayerStore.currentIndex + 1} von {audioPlayerStore.queue.length}
					</div>
				{/if}
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

	.viz-background :global(canvas) {
		height: 100% !important;
		width: 100% !important;
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

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
	}

	.top-btn {
		padding: 0.5rem;
		border-radius: var(--radius-lg);
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		cursor: pointer;
		backdrop-filter: blur(8px);
		transition: background 150ms ease;
	}

	.top-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.now-playing {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.flex-1 {
		flex: 1;
	}

	.bottom-section {
		padding: 1.5rem;
		padding-bottom: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 28rem;
		margin: 0 auto;
		width: 100%;
	}

	.file-hero {
		text-align: center;
	}

	.file-hero-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 5rem;
		height: 5rem;
		border-radius: var(--radius-xl);
		background: rgba(255, 255, 255, 0.1);
		color: white;
		margin-bottom: 0.75rem;
		backdrop-filter: blur(8px);
	}

	.file-hero-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: white;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-hero-type {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.25rem;
	}

	.progress-section {
		width: 100%;
	}

	.progress-bar {
		position: relative;
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		cursor: pointer;
		border: none;
		padding: 0;
		display: block;
	}

	.progress-bar-fill {
		height: 100%;
		background: white;
		border-radius: 3px;
		transition: width 100ms ease;
	}

	.progress-bar-thumb {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 14px;
		height: 14px;
		background: white;
		border-radius: 50%;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.progress-times {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		font-variant-numeric: tabular-nums;
	}

	.transport {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
	}

	.transport-btn {
		padding: 0.5rem;
		border-radius: 50%;
		background: transparent;
		border: none;
		color: white;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.transport-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.transport-btn.play {
		padding: 1rem;
		background: white;
		color: black;
	}

	.transport-btn.play:hover {
		opacity: 0.9;
	}

	.volume-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.volume-slider {
		width: 6rem;
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

	.queue-info {
		text-align: center;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
	}
</style>
