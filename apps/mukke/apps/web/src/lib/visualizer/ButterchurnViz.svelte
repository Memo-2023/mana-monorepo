<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import { connectAnalyzer, getAudioContext, getSourceNode, resumeAudioContext } from './analyzer';

	interface Props {
		height?: number;
		/** Blend duration when switching presets (seconds) */
		blendTime?: number;
	}

	let { height = 300, blendTime = 2.7 }: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let visualizer: any = null;
	let animationId: number | null = null;
	let isInitialized = $state(false);
	let presetNames: string[] = $state([]);
	let currentPresetIndex = $state(0);
	let currentPresetName = $state('');

	// Lazy-loaded modules
	let butterchurnModule: any = null;
	let presets: Record<string, any> = {};

	async function loadButterchurn() {
		if (butterchurnModule) return;
		const [bc, bcPresets] = await Promise.all([
			import('butterchurn'),
			import('butterchurn-presets'),
		]);
		butterchurnModule = bc.default || bc;
		const getPresets = bcPresets.default || bcPresets;
		presets = typeof getPresets === 'function' ? getPresets() : getPresets;
		presetNames = Object.keys(presets).sort();
	}

	async function initVisualizer() {
		if (!canvas || isInitialized) return;

		const audio = playerStore.getAudioElement();
		if (!audio) return;

		try {
			connectAnalyzer(audio);
			await resumeAudioContext();
			await loadButterchurn();

			const audioContext = getAudioContext();
			const sourceNode = getSourceNode();
			if (!audioContext || !sourceNode) return;

			const width = canvas.clientWidth;
			const dpr = window.devicePixelRatio || 1;

			visualizer = butterchurnModule.createVisualizer(audioContext, canvas, {
				width: Math.floor(width * dpr),
				height: Math.floor(height * dpr),
				pixelRatio: dpr,
				textureRatio: 1,
			});

			visualizer.connectAudio(sourceNode);

			// Load a random preset to start
			if (presetNames.length > 0) {
				currentPresetIndex = Math.floor(Math.random() * presetNames.length);
				loadPresetByIndex(currentPresetIndex, 0);
			}

			isInitialized = true;
		} catch (e) {
			console.warn('[Butterchurn] Failed to initialize:', e);
		}
	}

	function loadPresetByIndex(index: number, blend: number) {
		if (!visualizer || presetNames.length === 0) return;
		const name = presetNames[index];
		currentPresetName = name;
		currentPresetIndex = index;
		visualizer.loadPreset(presets[name], blend);
	}

	export function nextPreset() {
		const next = (currentPresetIndex + 1) % presetNames.length;
		loadPresetByIndex(next, blendTime);
	}

	export function previousPreset() {
		const prev = (currentPresetIndex - 1 + presetNames.length) % presetNames.length;
		loadPresetByIndex(prev, blendTime);
	}

	export function randomPreset() {
		const rand = Math.floor(Math.random() * presetNames.length);
		loadPresetByIndex(rand, blendTime);
	}

	// Initialize when playing starts
	$effect(() => {
		if (playerStore.isPlaying && canvas && !isInitialized) {
			initVisualizer();
		}
	});

	// Animation loop
	$effect(() => {
		if (playerStore.isPlaying && isInitialized) {
			startAnimation();
		} else {
			stopAnimation();
		}
		return () => stopAnimation();
	});

	// Resize handling
	$effect(() => {
		if (visualizer && canvas) {
			const dpr = window.devicePixelRatio || 1;
			const width = canvas.clientWidth;
			visualizer.setRendererSize(Math.floor(width * dpr), Math.floor(height * dpr));
		}
	});

	function startAnimation() {
		if (animationId !== null) return;
		function loop() {
			if (visualizer) {
				visualizer.render();
			}
			animationId = requestAnimationFrame(loop);
		}
		animationId = requestAnimationFrame(loop);
	}

	function stopAnimation() {
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}
	}
</script>

<div class="relative w-full" style="height: {height}px;">
	<canvas
		bind:this={canvas}
		class="w-full h-full rounded-lg"
		style="height: {height}px;"
		aria-hidden="true"
	></canvas>

	{#if isInitialized}
		<!-- Preset controls overlay -->
		<div
			class="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-300"
		>
			<button
				onclick={previousPreset}
				class="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
				aria-label="Previous preset"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
				</svg>
			</button>

			<span class="text-xs text-white/80 bg-black/50 px-2 py-1 rounded truncate max-w-[60%]">
				{currentPresetName}
			</span>

			<button
				onclick={nextPreset}
				class="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
				aria-label="Next preset"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
				</svg>
			</button>
		</div>
	{/if}
</div>
