<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { audioStore } from '$lib/stores/audio.svelte';
	import { editorStore } from '$lib/stores/editor.svelte';
	import { MARKER_COLORS, type MarkerType } from '@lightwrite/shared';

	interface Props {
		onMarkerClick?: (markerId: string) => void;
		onSeek?: (time: number) => void;
		onToggleLoop?: (markerId: string) => void;
	}

	let { onMarkerClick, onSeek, onToggleLoop }: Props = $props();

	let containerRef: HTMLDivElement;

	const markerTypes: MarkerType[] = [
		'intro',
		'verse',
		'hook',
		'bridge',
		'drop',
		'breakdown',
		'outro',
		'custom',
	];

	function handleTimelineClick(e: MouseEvent) {
		if (!containerRef || !audioStore.duration) return;

		const rect = containerRef.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const time = (x / rect.width) * audioStore.duration;
		onSeek?.(time);
	}

	function getMarkerPosition(time: number): number {
		if (!audioStore.duration) return 0;
		return (time / audioStore.duration) * 100;
	}

	function getMarkerWidth(startTime: number, endTime: number | null | undefined): number {
		if (!audioStore.duration || !endTime) return 0.5;
		return ((endTime - startTime) / audioStore.duration) * 100;
	}

	async function handleAddMarker() {
		const beatId = projectStore.currentBeat?.id;
		if (!beatId) return;

		await projectStore.createMarker(beatId, {
			type: editorStore.markerTypeToCreate,
			startTime: audioStore.currentTime,
			endTime: audioStore.currentTime + 4, // Default 4 seconds
			color: MARKER_COLORS[editorStore.markerTypeToCreate],
		});
	}

	async function handleDeleteMarker(markerId: string) {
		await projectStore.deleteMarker(markerId);
		if (editorStore.selectedMarkerId === markerId) {
			editorStore.selectMarker(null);
		}
	}
</script>

<div class="flex flex-col gap-2 p-4 bg-surface rounded-lg">
	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium">Markers</span>

			<!-- Marker type selector -->
			<select
				value={editorStore.markerTypeToCreate}
				onchange={(e) =>
					editorStore.setMarkerTypeToCreate((e.target as HTMLSelectElement).value as MarkerType)}
				class="px-2 py-1 text-sm bg-surface-hover rounded border border-border"
			>
				{#each markerTypes as type}
					<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
				{/each}
			</select>

			<button
				onclick={handleAddMarker}
				disabled={!projectStore.currentBeat}
				class="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50"
			>
				Add Marker
			</button>
		</div>

		<!-- Legend -->
		<div class="flex items-center gap-3 text-xs">
			{#each markerTypes.slice(0, 5) as type}
				<div class="flex items-center gap-1">
					<span class="w-3 h-3 rounded" style="background-color: {MARKER_COLORS[type]}"></span>
					<span>{type}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Timeline ruler -->
	<div
		bind:this={containerRef}
		class="timeline-ruler relative cursor-pointer"
		onclick={handleTimelineClick}
		role="slider"
		tabindex="0"
		aria-valuemin="0"
		aria-valuemax={audioStore.duration}
		aria-valuenow={audioStore.currentTime}
	>
		<!-- Markers -->
		{#each projectStore.currentMarkers as marker}
			<button
				onclick={(e) => {
					e.stopPropagation();
					onMarkerClick?.(marker.id);
				}}
				class="timeline-marker {editorStore.selectedMarkerId === marker.id
					? 'ring-2 ring-white'
					: ''}"
				style="
					left: {getMarkerPosition(marker.startTime)}%;
					width: {getMarkerWidth(marker.startTime, marker.endTime)}%;
					background-color: {marker.color || MARKER_COLORS[marker.type as MarkerType]};
				"
				title="{marker.type}{marker.label ? `: ${marker.label}` : ''}"
			>
				<span class="text-[10px] text-white truncate px-1">
					{marker.label || marker.type}
				</span>
			</button>
		{/each}

		<!-- Playhead -->
		{#if audioStore.duration > 0}
			<div class="playhead" style="left: {getMarkerPosition(audioStore.currentTime)}%"></div>
		{/if}
	</div>

	<!-- Selected marker info -->
	{#if editorStore.selectedMarkerId}
		{@const selectedMarker = projectStore.currentMarkers.find(
			(m) => m.id === editorStore.selectedMarkerId
		)}
		{#if selectedMarker}
			<div class="flex items-center justify-between p-2 bg-surface-hover rounded text-sm">
				<div class="flex items-center gap-2">
					<span
						class="w-4 h-4 rounded"
						style="background-color: {selectedMarker.color ||
							MARKER_COLORS[selectedMarker.type as MarkerType]}"
					></span>
					<span class="font-medium">{selectedMarker.type}</span>
					{#if selectedMarker.label}
						<span class="text-foreground-secondary">- {selectedMarker.label}</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					<span class="text-foreground-secondary">
						{selectedMarker.startTime.toFixed(2)}s - {(
							selectedMarker.endTime || selectedMarker.startTime
						).toFixed(2)}s
					</span>
					<button
						onclick={() => onToggleLoop?.(selectedMarker.id)}
						class="p-1 rounded transition-colors {editorStore.loopRegionId === selectedMarker.id
							? 'text-primary bg-primary/10'
							: 'text-foreground-secondary hover:bg-surface-active'}"
						title={editorStore.loopRegionId === selectedMarker.id
							? 'Stop Loop (L)'
							: 'Loop Region (L)'}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</button>
					<button
						onclick={() => handleDeleteMarker(selectedMarker.id)}
						class="p-1 text-red-500 hover:bg-red-500/10 rounded"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
