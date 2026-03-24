<script lang="ts">
	import { SCENE, LAKES, RIVERS } from './data/layout';
	import { createMockEcosystem } from './data/mockData';
	import Background from './terrain/Background.svelte';
	import Terrain from './terrain/Terrain.svelte';
	import WaterBody from './terrain/WaterBody.svelte';
	import RiverFlow from './water/RiverFlow.svelte';
	import PlantFactory from './plants/PlantFactory.svelte';

	let { onSelectApp }: { onSelectApp?: (appId: string) => void } = $props();

	let apps = $state(createMockEcosystem());
	let selectedApp = $state<string | null>(null);

	// Pan & zoom state
	let svgEl: SVGSVGElement | undefined = $state();
	let viewBox = $state({ x: 0, y: 0, w: SCENE.width as number, h: SCENE.height as number });
	let isPanning = $state(false);
	let panStart = $state({ x: 0, y: 0 });
	let panViewBoxStart = $state({ x: 0, y: 0 });

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const scaleFactor = e.deltaY > 0 ? 1.08 : 0.92;
		const rect = svgEl?.getBoundingClientRect();
		if (!rect) return;

		// Mouse position as fraction of SVG
		const mx = (e.clientX - rect.left) / rect.width;
		const my = (e.clientY - rect.top) / rect.height;

		// Point in viewBox coordinates under mouse
		const px = viewBox.x + mx * viewBox.w;
		const py = viewBox.y + my * viewBox.h;

		// Scale viewBox dimensions
		const nw = Math.max(400, Math.min(SCENE.width * 2, viewBox.w * scaleFactor));
		const nh = Math.max(225, Math.min(SCENE.height * 2, viewBox.h * scaleFactor));

		// Adjust position to keep point under mouse
		viewBox = {
			x: px - mx * nw,
			y: py - my * nh,
			w: nw,
			h: nh,
		};
	}

	function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		isPanning = true;
		panStart = { x: e.clientX, y: e.clientY };
		panViewBoxStart = { x: viewBox.x, y: viewBox.y };
		(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isPanning || !svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		const dx = ((e.clientX - panStart.x) / rect.width) * viewBox.w;
		const dy = ((e.clientY - panStart.y) / rect.height) * viewBox.h;
		viewBox = {
			...viewBox,
			x: panViewBoxStart.x - dx,
			y: panViewBoxStart.y - dy,
		};
	}

	function handlePointerUp() {
		isPanning = false;
	}

	function handleAppClick(appId: string) {
		selectedApp = appId;
		onSelectApp?.(appId);
	}

	function resetView() {
		viewBox = { x: 0, y: 0, w: SCENE.width, h: SCENE.height };
	}

	let viewBoxStr = $derived(`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
</script>

<div
	class="relative overflow-hidden rounded-xl"
	style="width: 100%; height: 100%; min-height: 500px; background-color: #e0f2fe;"
>
	<!-- Reset zoom button -->
	<button
		type="button"
		onclick={resetView}
		class="absolute right-3 top-3 z-10 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
	>
		Reset View
	</button>

	<!-- Title overlay -->
	<div class="absolute left-4 top-3 z-10">
		<h2 class="text-lg font-semibold text-slate-700/80" style="font-family: serif;">
			Mana Seenplatte
		</h2>
		<p class="text-xs text-slate-500/70">Ecosystem Observatory</p>
	</div>

	<!-- Legend -->
	<div
		class="absolute bottom-3 left-3 z-10 flex gap-3 rounded-lg bg-white/70 px-3 py-2 text-[10px] text-slate-600 backdrop-blur-sm"
	>
		<span class="flex items-center gap-1">
			<svg width="12" height="12"><circle cx="6" cy="8" r="3" fill="#2D6B30" /></svg>
			Mature
		</span>
		<span class="flex items-center gap-1">
			<svg width="12" height="12"><circle cx="6" cy="8" r="3" fill="#3E8B42" /></svg>
			Production
		</span>
		<span class="flex items-center gap-1">
			<svg width="12" height="12"><circle cx="6" cy="8" r="3" fill="#7DB86A" /></svg>
			Beta
		</span>
		<span class="flex items-center gap-1">
			<svg width="12" height="12"><circle cx="6" cy="8" r="3" fill="#C4B848" /></svg>
			Alpha
		</span>
	</div>

	<svg
		bind:this={svgEl}
		viewBox={viewBoxStr}
		preserveAspectRatio="xMidYMid meet"
		xmlns="http://www.w3.org/2000/svg"
		style="width: 100%; height: 100%; display: block; cursor: {isPanning ? 'grabbing' : 'grab'};"
		onwheel={handleWheel}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerUp}
	>
		<!-- Layer 1: Sky + Mountains -->
		<Background />

		<!-- Layer 2: Terrain (meadows, shores) -->
		<Terrain />

		<!-- Layer 3: Rivers (behind lakes) -->
		{#each RIVERS as river}
			<RiverFlow {river} />
		{/each}

		<!-- Layer 4: Lakes -->
		{#each LAKES as lake}
			<WaterBody {lake} />
		{/each}

		<!-- Layer 5: Plants (apps) sorted by y-position for depth -->
		{#each apps.toSorted((a, b) => a.position.y - b.position.y) as app (app.id)}
			<PlantFactory {app} onclick={() => handleAppClick(app.id)} />
		{/each}
	</svg>
</div>
