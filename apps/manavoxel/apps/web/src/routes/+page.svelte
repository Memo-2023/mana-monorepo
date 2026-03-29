<script lang="ts">
	import { onMount } from 'svelte';
	import { GameEngine } from '$lib/engine/game';
	import { DEFAULT_MATERIALS, MATERIAL_AIR } from '@manavoxel/shared';
	import type { ToolType } from '$lib/editor/tools';

	let canvasContainer: HTMLDivElement;
	let engine: GameEngine | null = $state(null);
	let isEditing = $state(false);
	let selectedMaterial = $state(1);
	let activeTool = $state<ToolType>('brush');
	let brushSize = $state(1);

	const tools: { id: ToolType; label: string; key: string }[] = [
		{ id: 'brush', label: 'Brush', key: 'B' },
		{ id: 'eraser', label: 'Eraser', key: 'E' },
		{ id: 'fill', label: 'Fill', key: 'G' },
		{ id: 'pipette', label: 'Pick', key: 'I' },
	];

	const materials = DEFAULT_MATERIALS.filter((m) => m.id !== MATERIAL_AIR);

	onMount(() => {
		const e = new GameEngine(canvasContainer);
		engine = e;

		e.onStateChange = () => {
			isEditing = e.isEditing;
			selectedMaterial = e.selectedMaterial;
			activeTool = e.activeTool;
			brushSize = e.brushSize;
		};

		// Keyboard shortcuts
		const onKey = (ev: KeyboardEvent) => {
			if (ev.target instanceof HTMLInputElement) return;
			switch (ev.key.toLowerCase()) {
				case 'tab':
					ev.preventDefault();
					e.toggleEditor();
					break;
				case 'b':
					e.setTool('brush');
					break;
				case 'e':
					e.setTool('eraser');
					break;
				case 'g':
					e.setTool('fill');
					break;
				case 'i':
					e.setTool('pipette');
					break;
				case '[':
					e.setBrushSize(e.brushSize - 2);
					break;
				case ']':
					e.setBrushSize(e.brushSize + 2);
					break;
			}
			// Number keys 1-9 select materials
			const num = parseInt(ev.key);
			if (num >= 1 && num <= 9 && num <= materials.length) {
				e.setMaterial(materials[num - 1].id);
			}
		};
		window.addEventListener('keydown', onKey);

		return () => {
			window.removeEventListener('keydown', onKey);
			e.destroy();
		};
	});
</script>

<div class="relative h-screen w-screen overflow-hidden bg-gray-900">
	<!-- PixiJS Canvas -->
	<div bind:this={canvasContainer} class="game-canvas h-full w-full"></div>

	<!-- HUD Overlay -->
	<div class="pointer-events-none absolute inset-0">
		<!-- Top bar -->
		<div class="pointer-events-auto flex items-center justify-between p-3">
			<div class="flex items-center gap-3">
				<div
					class="rounded-lg bg-gray-800/80 px-3 py-1.5 text-sm font-medium text-white backdrop-blur"
				>
					ManaVoxel
				</div>
				{#if !isEditing && engine?.player}
					<div class="rounded-lg bg-gray-800/80 px-3 py-1.5 text-xs text-gray-300 backdrop-blur">
						HP: {engine.player.hp}/{engine.player.maxHp}
					</div>
				{/if}
				{#if isEditing}
					<div class="rounded-lg bg-emerald-600/80 px-2 py-1 text-xs text-white backdrop-blur">
						EDITOR
					</div>
				{/if}
			</div>
			<div class="flex gap-2">
				<button
					class="rounded-lg px-3 py-1.5 text-sm text-white backdrop-blur transition {isEditing
						? 'bg-emerald-600/80 hover:bg-emerald-500/80'
						: 'bg-gray-800/80 hover:bg-gray-700/80'}"
					onclick={() => engine?.toggleEditor()}
				>
					{isEditing ? 'Play' : 'Edit'}
					<span class="ml-1 text-xs text-gray-400">Tab</span>
				</button>
			</div>
		</div>

		<!-- Editor Tools (left side) -->
		{#if isEditing}
			<div class="pointer-events-auto absolute left-3 top-16 flex flex-col gap-1">
				{#each tools as tool}
					<button
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-white backdrop-blur transition {activeTool ===
						tool.id
							? 'bg-emerald-600/80'
							: 'bg-gray-800/80 hover:bg-gray-700/80'}"
						onclick={() => engine?.setTool(tool.id)}
					>
						{tool.label}
						<span class="text-gray-500">{tool.key}</span>
					</button>
				{/each}

				<!-- Brush size -->
				<div class="mt-2 rounded-lg bg-gray-800/80 px-3 py-2 text-xs text-white backdrop-blur">
					<div class="mb-1 text-gray-400">Size: {brushSize}px</div>
					<div class="flex gap-1">
						{#each [1, 3, 5, 7] as size}
							<button
								class="rounded px-2 py-0.5 transition {brushSize === size
									? 'bg-emerald-600'
									: 'bg-gray-700 hover:bg-gray-600'}"
								onclick={() => engine?.setBrushSize(size)}
							>
								{size}
							</button>
						{/each}
					</div>
				</div>

				<!-- Undo/Redo -->
				<div class="mt-2 flex gap-1">
					<button
						class="rounded-lg bg-gray-800/80 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-gray-700/80 disabled:opacity-30"
						disabled={!engine?.undo.canUndo}
						onclick={() => engine?.undo.undo(engine.tilemap)}
					>
						Undo
					</button>
					<button
						class="rounded-lg bg-gray-800/80 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-gray-700/80 disabled:opacity-30"
						disabled={!engine?.undo.canRedo}
						onclick={() => engine?.undo.redo(engine.tilemap)}
					>
						Redo
					</button>
				</div>
			</div>
		{/if}

		<!-- Material Palette (bottom) -->
		{#if isEditing}
			<div class="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2">
				<div class="flex gap-1 rounded-lg bg-gray-800/90 p-2 backdrop-blur">
					{#each materials as mat, i}
						<button
							class="group relative h-8 w-8 rounded border-2 transition-transform hover:scale-110 {selectedMaterial ===
							mat.id
								? 'border-white scale-110'
								: 'border-transparent'}"
							style="background-color: {mat.color}"
							onclick={() => engine?.setMaterial(mat.id)}
							title="{mat.name} ({i + 1})"
						>
							{#if i < 9}
								<span
									class="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100"
								>
									{i + 1}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Controls hint (bottom left) -->
		<div class="pointer-events-auto absolute bottom-4 left-4">
			<div class="rounded-lg bg-gray-800/60 px-3 py-1.5 text-[10px] text-gray-500 backdrop-blur">
				{#if isEditing}
					WASD: Pan | Scroll: Zoom | LClick: Place | RClick: Erase | 1-9: Material
				{:else}
					WASD: Move | Scroll: Zoom | Tab: Editor
				{/if}
			</div>
		</div>
	</div>
</div>
