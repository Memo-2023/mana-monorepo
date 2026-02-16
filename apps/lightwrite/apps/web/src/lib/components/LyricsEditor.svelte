<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { audioStore } from '$lib/stores/audio.svelte';
	import { editorStore } from '$lib/stores/editor.svelte';
	import { formatTimeWithMs } from '$lib/utils/time-format';
	import type { LyricLine } from '@lightwrite/shared';

	interface Props {
		onLineClick?: (lineIndex: number, line: LyricLine) => void;
		onSyncLine?: (lineIndex: number) => void;
	}

	let { onLineClick, onSyncLine }: Props = $props();

	let textContent = $state('');
	let isSaving = $state(false);

	// Initialize text content from lyrics
	$effect(() => {
		if (projectStore.currentLyrics?.content) {
			textContent = projectStore.currentLyrics.content;
		}
	});

	// Find the currently active line based on playback time
	let activeLineIndex = $derived.by(() => {
		if (!audioStore.isPlaying) return null;

		const currentTime = audioStore.currentTime;
		const lines = projectStore.currentLines;

		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i];
			if (
				line.startTime !== null &&
				line.startTime !== undefined &&
				currentTime >= line.startTime
			) {
				// Check if we're past the end time
				if (line.endTime && currentTime > line.endTime) {
					// Check if next line has started
					const nextLine = lines[i + 1];
					if (
						nextLine?.startTime !== null &&
						nextLine?.startTime !== undefined &&
						currentTime >= nextLine.startTime
					) {
						continue;
					}
				}
				return i;
			}
		}
		return null;
	});

	async function handleSave() {
		if (!projectStore.currentProject) return;

		isSaving = true;
		try {
			// Save lyrics content
			const lyrics = await projectStore.updateLyrics(projectStore.currentProject.id, textContent);

			// Parse and sync lines
			const lines = textContent
				.split('\n')
				.map((text, index) => {
					// Find existing line to preserve timestamp
					const existingLine = projectStore.currentLines.find((l) => l.lineNumber === index);
					return {
						lineNumber: index,
						text: text.trim(),
						startTime: existingLine?.startTime ?? undefined,
						endTime: existingLine?.endTime ?? undefined,
					};
				})
				.filter((l) => l.text.length > 0);

			await projectStore.syncLines(lyrics.id, lines);
		} finally {
			isSaving = false;
		}
	}

	function handleLineClick(index: number) {
		const line = projectStore.currentLines[index];
		if (line) {
			editorStore.selectLine(index);
			onLineClick?.(index, line);
		}
	}

	function handleSyncClick(index: number, e: Event) {
		e.stopPropagation();
		onSyncLine?.(index);
	}

	async function handleTimestampUpdate(lineId: string) {
		const currentTime = audioStore.currentTime;
		await projectStore.updateLineTimestamp(lineId, currentTime);
	}
</script>

<div class="flex flex-col h-full">
	<!-- Toolbar -->
	<div class="flex items-center justify-between p-3 border-b border-border">
		<h3 class="font-medium">Lyrics</h3>
		<div class="flex items-center gap-2">
			<button
				onclick={() => editorStore.setRecordingTimestamps(!editorStore.isRecordingTimestamps)}
				class="px-3 py-1 text-sm rounded-lg transition-colors {editorStore.isRecordingTimestamps
					? 'bg-red-500 text-white'
					: 'bg-surface-hover hover:bg-surface-active'}"
			>
				{editorStore.isRecordingTimestamps ? 'Stop Recording' : 'Record Timestamps'}
			</button>
			<button
				onclick={handleSave}
				disabled={isSaving}
				class="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
			>
				{isSaving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</div>

	<!-- Mode toggle -->
	<div class="flex p-2 gap-2">
		<button
			onclick={() => editorStore.setMode('edit')}
			class="flex-1 px-3 py-2 text-sm rounded-lg transition-colors {editorStore.mode === 'edit'
				? 'bg-primary text-white'
				: 'bg-surface-hover'}"
		>
			Edit
		</button>
		<button
			onclick={() => editorStore.setMode('preview')}
			class="flex-1 px-3 py-2 text-sm rounded-lg transition-colors {editorStore.mode === 'preview'
				? 'bg-primary text-white'
				: 'bg-surface-hover'}"
		>
			Preview
		</button>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-4">
		{#if editorStore.mode === 'edit'}
			<!-- Edit mode: textarea -->
			<textarea
				bind:value={textContent}
				class="w-full h-full p-4 bg-surface rounded-lg border border-border focus:border-primary focus:outline-none resize-none lyrics-editor"
				placeholder="Enter your lyrics here...&#10;&#10;Each line will be synced to a timestamp."
			></textarea>
		{:else}
			<!-- Preview mode: synced lines -->
			<div class="space-y-1">
				{#each projectStore.currentLines as line, index}
					<div
						role="button"
						tabindex="0"
						onclick={() => handleLineClick(index)}
						onkeydown={(e) => e.key === 'Enter' && handleLineClick(index)}
						class="lyrics-line w-full text-left flex items-center gap-3 cursor-pointer {activeLineIndex ===
						index
							? 'active'
							: ''} {line.startTime !== null ? 'synced' : ''} {editorStore.selectedLineIndex ===
						index
							? 'ring-2 ring-primary'
							: ''}"
					>
						<!-- Timestamp -->
						<span class="text-xs font-mono text-foreground-secondary min-w-[60px]">
							{line.startTime !== null && line.startTime !== undefined
								? formatTimeWithMs(line.startTime)
								: '--:--'}
						</span>

						<!-- Line text -->
						<span class="flex-1">{line.text}</span>

						<!-- Sync button -->
						{#if editorStore.isRecordingTimestamps}
							<button
								onclick={(e) => handleSyncClick(index, e)}
								class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
							>
								Sync
							</button>
						{:else if line.startTime === null || line.startTime === undefined}
							<button
								onclick={(e) => {
									e.stopPropagation();
									handleTimestampUpdate(line.id);
								}}
								class="px-2 py-1 text-xs bg-surface-hover text-foreground-secondary rounded hover:bg-surface-active"
							>
								Set Time
							</button>
						{/if}
					</div>
				{/each}

				{#if projectStore.currentLines.length === 0}
					<p class="text-center text-foreground-secondary py-8">
						No lyrics yet. Switch to Edit mode to add lyrics.
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
