<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import WaveSurfer from 'wavesurfer.js';
	import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.js';
	import { audioStore } from '$lib/stores/audio.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { editorStore } from '$lib/stores/editor.svelte';
	import { MARKER_COLORS, type Marker, type MarkerType } from '@lightwrite/shared';

	let containerRef: HTMLDivElement;
	let wavesurfer: WaveSurfer | null = null;
	let regionsPlugin: RegionsPlugin | null = null;

	interface Props {
		audioUrl: string | null;
		onTimeUpdate?: (time: number) => void;
		onSeek?: (time: number) => void;
	}

	let { audioUrl, onTimeUpdate, onSeek }: Props = $props();

	onMount(() => {
		if (!containerRef) return;

		regionsPlugin = RegionsPlugin.create();

		wavesurfer = WaveSurfer.create({
			container: containerRef,
			waveColor: '#6B7280',
			progressColor: '#3B82F6',
			cursorColor: '#EF4444',
			cursorWidth: 2,
			height: 128,
			normalize: true,
			plugins: [regionsPlugin],
		});

		wavesurfer.on('ready', () => {
			audioStore.setDuration(wavesurfer!.getDuration());
			audioStore.setLoaded(true);
			syncRegionsFromMarkers();
		});

		wavesurfer.on('play', () => audioStore.setPlaying(true));
		wavesurfer.on('pause', () => audioStore.setPlaying(false));

		wavesurfer.on('timeupdate', (time) => {
			audioStore.setCurrentTime(time);
			onTimeUpdate?.(time);
		});

		wavesurfer.on('seeking', (time) => {
			audioStore.setCurrentTime(time);
			onSeek?.(time);
		});

		// Region events
		regionsPlugin.on('region-created', (region: Region) => {
			// Skip if this is a sync operation
			if (region.id.startsWith('marker-')) return;

			const beatId = projectStore.currentBeat?.id;
			if (!beatId) return;

			// Create marker from region
			projectStore.createMarker(beatId, {
				type: editorStore.markerTypeToCreate,
				startTime: region.start,
				endTime: region.end,
				color: MARKER_COLORS[editorStore.markerTypeToCreate],
			});
		});

		regionsPlugin.on('region-updated', (region: Region) => {
			const markerId = region.id.replace('marker-', '');
			const marker = projectStore.currentMarkers.find((m) => m.id === markerId);
			if (marker) {
				projectStore.updateMarker(markerId, {
					startTime: region.start,
					endTime: region.end,
				});
			}
		});

		regionsPlugin.on('region-clicked', (region: Region, e: MouseEvent) => {
			e.stopPropagation();
			const markerId = region.id.replace('marker-', '');
			editorStore.selectMarker(markerId);
		});

		if (audioUrl) {
			wavesurfer.load(audioUrl);
		}
	});

	onDestroy(() => {
		wavesurfer?.destroy();
	});

	// Watch for audio URL changes
	$effect(() => {
		if (wavesurfer && audioUrl) {
			wavesurfer.load(audioUrl);
		}
	});

	// Watch for marker changes and sync regions
	$effect(() => {
		const markers = projectStore.currentMarkers;
		if (markers && regionsPlugin && audioStore.isLoaded) {
			syncRegionsFromMarkers();
		}
	});

	function syncRegionsFromMarkers() {
		if (!regionsPlugin) return;

		// Clear existing regions
		regionsPlugin.clearRegions();

		// Add regions for each marker
		for (const marker of projectStore.currentMarkers) {
			regionsPlugin.addRegion({
				id: `marker-${marker.id}`,
				start: marker.startTime,
				end: marker.endTime || marker.startTime + 1,
				color: `${marker.color || MARKER_COLORS[marker.type as MarkerType]}40`,
				drag: true,
				resize: true,
				content: marker.label || marker.type,
			});
		}
	}

	export function play() {
		wavesurfer?.play();
	}

	export function pause() {
		wavesurfer?.pause();
	}

	export function playPause() {
		wavesurfer?.playPause();
	}

	export function seekTo(time: number) {
		if (wavesurfer) {
			wavesurfer.seekTo(time / wavesurfer.getDuration());
		}
	}

	export function zoom(level: number) {
		wavesurfer?.zoom(level * 100);
	}

	export function addRegion(start: number, end: number, type: MarkerType) {
		if (regionsPlugin) {
			regionsPlugin.addRegion({
				start,
				end,
				color: `${MARKER_COLORS[type]}40`,
				drag: true,
				resize: true,
				content: type,
			});
		}
	}
</script>

<div class="waveform-container" bind:this={containerRef}>
	{#if !audioStore.isLoaded && audioUrl}
		<div class="absolute inset-0 flex items-center justify-center">
			<div
				class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
			></div>
		</div>
	{/if}
</div>
