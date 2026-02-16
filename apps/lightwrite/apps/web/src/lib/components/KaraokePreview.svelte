<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { audioStore } from '$lib/stores/audio.svelte';

	interface Props {
		fontSize?: number;
		showPastLines?: number;
		showFutureLines?: number;
	}

	let { fontSize = 24, showPastLines = 1, showFutureLines = 2 }: Props = $props();

	// Find the current line index based on playback time
	let currentLineIndex = $derived.by(() => {
		const currentTime = audioStore.currentTime;
		const lines = projectStore.currentLines;

		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i];
			if (
				line.startTime !== null &&
				line.startTime !== undefined &&
				currentTime >= line.startTime
			) {
				return i;
			}
		}
		return 0;
	});

	// Get visible lines
	let visibleLines = $derived.by(() => {
		const lines = projectStore.currentLines;
		const start = Math.max(0, currentLineIndex - showPastLines);
		const end = Math.min(lines.length, currentLineIndex + showFutureLines + 1);
		return lines.slice(start, end).map((line, idx) => ({
			...line,
			relativeIndex: start + idx - currentLineIndex,
		}));
	});

	// Calculate progress within current line
	let lineProgress = $derived.by(() => {
		const lines = projectStore.currentLines;
		const currentLine = lines[currentLineIndex];
		if (!currentLine || currentLine.startTime === null || currentLine.startTime === undefined) {
			return 0;
		}

		const endTime =
			currentLine.endTime || (lines[currentLineIndex + 1]?.startTime ?? audioStore.duration);
		const lineDuration = endTime - currentLine.startTime;
		const elapsed = audioStore.currentTime - currentLine.startTime;

		return Math.min(1, Math.max(0, elapsed / lineDuration));
	});

	function getLineOpacity(relativeIndex: number): number {
		if (relativeIndex === 0) return 1;
		if (relativeIndex < 0) return 0.3;
		return 0.5;
	}

	function getLineScale(relativeIndex: number): number {
		if (relativeIndex === 0) return 1;
		return 0.9;
	}
</script>

<div
	class="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-b from-surface to-background"
	style="font-size: {fontSize}px"
>
	{#each visibleLines as line}
		<div
			class="karaoke-line text-center transition-all duration-300 py-2"
			style="
				opacity: {getLineOpacity(line.relativeIndex)};
				transform: scale({getLineScale(line.relativeIndex)});
			"
		>
			{#if line.relativeIndex === 0}
				<!-- Current line with progress highlight -->
				<div class="relative inline-block">
					<!-- Background text -->
					<span class="text-foreground-secondary">{line.text}</span>

					<!-- Highlighted text (clips based on progress) -->
					<span
						class="absolute inset-0 text-primary overflow-hidden whitespace-nowrap"
						style="width: {lineProgress * 100}%"
					>
						{line.text}
					</span>
				</div>
			{:else if line.relativeIndex < 0}
				<!-- Past line -->
				<span class="text-foreground-secondary">{line.text}</span>
			{:else}
				<!-- Future line -->
				<span class="text-foreground-secondary/50">{line.text}</span>
			{/if}
		</div>
	{/each}

	{#if projectStore.currentLines.length === 0}
		<p class="text-foreground-secondary text-center">No synced lyrics to preview.</p>
	{/if}
</div>
