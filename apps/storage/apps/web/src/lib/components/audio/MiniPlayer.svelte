<script lang="ts">
	import { audioPlayerStore } from '$lib/stores/audio-player.svelte';
	import FrequencyBars from './FrequencyBars.svelte';
	import { Play, Pause, SkipForward, SkipBack, X, FileAudio } from '@manacore/shared-icons';

	let progress = $derived(
		audioPlayerStore.duration > 0
			? (audioPlayerStore.currentTime / audioPlayerStore.duration) * 100
			: 0
	);

	function formatTime(s: number): string {
		if (!s || !isFinite(s)) return '0:00';
		return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
	}
</script>

{#if audioPlayerStore.currentFile}
	<div class="mini-player">
		<!-- Error toast -->
		{#if audioPlayerStore.error}
			<div class="error-bar">
				<span class="error-text">{audioPlayerStore.error}</span>
				<button
					class="error-dismiss"
					onclick={() => audioPlayerStore.clearError()}
					aria-label="Schließen"
				>
					<X size={14} />
				</button>
			</div>
		{/if}

		<!-- Frequency visualizer + progress bar -->
		<div class="viz-wrapper">
			<div class="viz-bars">
				<FrequencyBars barCount={64} height={20} barGap={1} barRadius={1} />
			</div>
			<div class="progress-track">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
		</div>

		<div class="player-content">
			<!-- File info -->
			<button class="file-info" onclick={() => audioPlayerStore.toggleFullPlayer()}>
				<div class="file-icon">
					<FileAudio size={20} />
				</div>
				<div class="file-meta">
					<div class="file-name">{audioPlayerStore.currentFile.name}</div>
					<div class="file-time">
						{formatTime(audioPlayerStore.currentTime)} / {formatTime(audioPlayerStore.duration)}
					</div>
				</div>
			</button>

			<!-- Controls -->
			<div class="controls">
				{#if audioPlayerStore.queue.length > 1}
					<button
						class="control-btn"
						onclick={() => audioPlayerStore.previousTrack()}
						aria-label="Vorheriger Track"
					>
						<SkipBack size={18} />
					</button>
				{/if}

				<button
					class="control-btn primary"
					onclick={() => audioPlayerStore.togglePlay()}
					aria-label={audioPlayerStore.isPlaying ? 'Pause' : 'Abspielen'}
				>
					{#if audioPlayerStore.isPlaying}
						<Pause size={20} weight="fill" />
					{:else}
						<Play size={20} weight="fill" />
					{/if}
				</button>

				{#if audioPlayerStore.queue.length > 1}
					<button
						class="control-btn"
						onclick={() => audioPlayerStore.nextTrack()}
						aria-label="Nächster Track"
					>
						<SkipForward size={18} />
					</button>
				{/if}

				<button
					class="control-btn close"
					onclick={() => audioPlayerStore.stop()}
					aria-label="Player schließen"
				>
					<X size={16} />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.mini-player {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 40;
		background: rgb(var(--color-surface-elevated));
		border-top: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		box-shadow: var(--shadow-lg);
	}

	.error-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 1rem;
		background: rgb(var(--color-error) / 0.1);
		border-bottom: 1px solid rgb(var(--color-error) / 0.2);
		font-size: 0.8125rem;
		color: rgb(var(--color-error));
	}

	.error-text {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.error-dismiss {
		padding: 0.125rem;
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		flex-shrink: 0;
	}

	.viz-wrapper {
		position: relative;
	}

	.viz-bars {
		opacity: 0.4;
	}

	.progress-track {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: rgb(var(--color-border));
	}

	.progress-fill {
		height: 100%;
		background: rgb(var(--color-primary));
		transition: width 0.2s ease;
	}

	.player-content {
		display: flex;
		align-items: center;
		height: 3.5rem;
		padding: 0 0.75rem;
		gap: 0.5rem;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex: 1;
		min-width: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		padding: 0;
		color: inherit;
	}

	.file-icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-md);
		background: rgb(var(--color-primary) / 0.1);
		color: rgb(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.file-meta {
		min-width: 0;
	}

	.file-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-time {
		font-size: 0.6875rem;
		color: rgb(var(--color-text-secondary));
		font-variant-numeric: tabular-nums;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		transition: all 150ms ease;
	}

	.control-btn:hover {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
	}

	.control-btn.primary {
		padding: 0.5rem;
		background: rgb(var(--color-primary));
		color: white;
		border-radius: 50%;
	}

	.control-btn.primary:hover {
		opacity: 0.9;
	}

	.control-btn.close {
		margin-left: 0.25rem;
	}

	.control-btn.close:hover {
		color: rgb(var(--color-error));
	}

	@media (max-width: 480px) {
		.file-time {
			display: none;
		}
	}
</style>
