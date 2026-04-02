<script lang="ts">
	import { audioStore } from '$lib/stores/audio.svelte';
	import { editorStore } from '$lib/stores/editor.svelte';
	import { formatTime } from '$lib/utils/time-format';
	import {
		MagnifyingGlassMinus,
		MagnifyingGlassPlus,
		Pause,
		Play,
		SkipBack,
		SkipForward,
	} from '@manacore/shared-icons';

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
				<Pause size={20} weight="fill" />
			{:else}
				<Play size={20} weight="fill" />
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
				<SkipForward size={20} />
			</button>

			<button
				onclick={handlePlayPause}
				class="p-3 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors"
				aria-label={audioStore.isPlaying ? 'Pause' : 'Play'}
			>
				{#if audioStore.isPlaying}
					<Pause size={24} weight="fill" />
				{:else}
					<Play size={24} weight="fill" />
				{/if}
			</button>

			<button
				onclick={skipForward}
				class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
				aria-label="Skip forward 5 seconds"
			>
				<SkipBack size={20} />
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
				<MagnifyingGlassMinus size={16} />
			</button>
			<span class="text-xs text-foreground-secondary min-w-[40px] text-center">
				{Math.round(editorStore.zoom * 100)}%
			</span>
			<button
				onclick={onZoomIn}
				class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
				aria-label="Zoom in"
			>
				<MagnifyingGlassPlus size={16} />
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
