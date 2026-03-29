<script lang="ts">
	import { onMount } from 'svelte';
	import { GameEngine } from '$lib/engine/game';
	import { DEFAULT_MATERIALS, MATERIAL_AIR } from '@manavoxel/shared';
	import type { ToolType } from '$lib/editor/tools';
	import SpriteEditor from '$lib/editor/sprite-editor.svelte';
	import type { SpriteData } from '$lib/editor/sprite-editor.svelte';
	import InventoryUI from '$lib/components/Inventory.svelte';
	import PropertyPanel from '$lib/editor/property-panel.svelte';
	import TriggerEditor from '$lib/editor/trigger-editor.svelte';
	import { Inventory, createItem, type GameItem } from '$lib/engine/inventory';
	import { gameStore } from '$lib/data/local-store';
	import { loadWorld, getAllWorlds } from '$lib/data/world-loader';

	let canvasContainer: HTMLDivElement;
	let engine: GameEngine | null = $state(null);
	let loading = $state(true);
	let isEditing = $state(false);
	let selectedMaterial = $state(1);
	let activeTool = $state<ToolType>('brush');
	let brushSize = $state(1);
	let areaName = $state('');
	let currentFloor = $state(0);
	let totalFloors = $state(1);
	let showSpriteEditor = $state(false);
	let showPropertyPanel = $state(false);
	let showTriggerEditor = $state(false);
	let editingItem = $state<GameItem | null>(null);
	let inventory = $state(new Inventory());
	let itemCounter = $state(0);

	const tools: { id: ToolType; label: string; key: string }[] = [
		{ id: 'brush', label: 'Brush', key: 'B' },
		{ id: 'eraser', label: 'Eraser', key: 'E' },
		{ id: 'fill', label: 'Fill', key: 'G' },
		{ id: 'pipette', label: 'Pick', key: 'I' },
	];

	const materials = DEFAULT_MATERIALS.filter((m) => m.id !== MATERIAL_AIR);

	onMount(async () => {
		// Initialize local-first database (creates tables, seeds guest data)
		await gameStore.initialize();

		// Check for world ID in URL, otherwise load first world
		const params = new URLSearchParams(window.location.search);
		const requestedWorldId = params.get('world');

		let worldData = null;
		if (requestedWorldId) {
			worldData = await loadWorld(requestedWorldId);
		}
		if (!worldData) {
			const worlds = await getAllWorlds();
			if (worlds.length > 0) {
				worldData = await loadWorld(worlds[0].id);
			}
		}

		const e = new GameEngine(canvasContainer, worldData ?? undefined);
		e.inventory = inventory;
		engine = e;
		loading = false;

		e.onStateChange = () => {
			isEditing = e.isEditing;
			selectedMaterial = e.selectedMaterial;
			activeTool = e.activeTool;
			brushSize = e.brushSize;
			areaName = e.areaName;
			currentFloor = e.currentFloor;
			totalFloors = e.totalFloors;
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
	<!-- Loading screen -->
	{#if loading}
		<div class="flex h-full w-full items-center justify-center">
			<div class="text-center">
				<div class="mb-3 text-2xl font-bold text-emerald-400">ManaVoxel</div>
				<div class="text-sm text-gray-500">Loading world...</div>
			</div>
		</div>
	{/if}

	<!-- PixiJS Canvas -->
	<div bind:this={canvasContainer} class="game-canvas h-full w-full" class:hidden={loading}></div>

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
				{#if areaName}
					<div class="rounded-lg bg-gray-800/80 px-3 py-1.5 text-xs text-gray-300 backdrop-blur">
						{areaName}
						{#if totalFloors > 1}
							<span class="ml-1 text-gray-500">F{currentFloor + 1}/{totalFloors}</span>
						{/if}
					</div>
				{/if}
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
				<a
					href="/worlds"
					class="rounded-lg bg-gray-800/80 px-3 py-1.5 text-sm text-gray-400 backdrop-blur hover:bg-gray-700/80 hover:text-white"
				>
					Worlds
				</a>
				{#if isEditing}
					<button
						class="rounded-lg bg-blue-600/80 px-3 py-1.5 text-sm text-white backdrop-blur hover:bg-blue-500/80"
						onclick={() => (showSpriteEditor = true)}
					>
						+ Item
					</button>
				{/if}
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

		<!-- Inventory bar (bottom center, always visible) -->
		{#if !showSpriteEditor}
			<div class="pointer-events-auto absolute bottom-14 left-1/2 -translate-x-1/2">
				<InventoryUI
					{inventory}
					onDrop={(slot) => {
						inventory.removeItem(slot);
					}}
					onInspect={(item) => {
						editingItem = item;
						showPropertyPanel = true;
						showTriggerEditor = false;
					}}
				/>
			</div>
		{/if}

		<!-- Controls hint (bottom left) -->
		<div class="pointer-events-auto absolute bottom-4 left-4">
			<div class="rounded-lg bg-gray-800/60 px-3 py-1.5 text-[10px] text-gray-500 backdrop-blur">
				{#if isEditing}
					WASD: Pan | Scroll: Zoom | LClick: Place | RClick: Erase | 1-9: Material
				{:else}
					WASD: Move | E: Door | F: Stairs | Scroll: Zoom | Tab: Editor
				{/if}
			</div>
		</div>
	</div>

	<!-- Item Editor Panels (right sidebar) -->
	{#if editingItem && (showPropertyPanel || showTriggerEditor)}
		<div class="pointer-events-auto absolute right-4 top-16 z-40 flex flex-col gap-2">
			<!-- Tab buttons -->
			<div class="flex gap-1">
				<button
					class="rounded-lg px-3 py-1 text-xs transition {showPropertyPanel && !showTriggerEditor
						? 'bg-emerald-600 text-white'
						: 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
					onclick={() => {
						showPropertyPanel = true;
						showTriggerEditor = false;
					}}
				>
					Properties
				</button>
				<button
					class="rounded-lg px-3 py-1 text-xs transition {showTriggerEditor
						? 'bg-emerald-600 text-white'
						: 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
					onclick={() => {
						showTriggerEditor = true;
						showPropertyPanel = false;
					}}
				>
					Behaviors
				</button>
			</div>

			{#if showPropertyPanel}
				<PropertyPanel
					item={editingItem}
					onUpdate={(updated) => {
						editingItem = updated;
					}}
					onClose={() => {
						showPropertyPanel = false;
						editingItem = null;
					}}
				/>
			{/if}

			{#if showTriggerEditor && editingItem}
				<TriggerEditor
					behaviors={[]}
					onUpdate={(behaviors) => {
						// Store behaviors on the item (extend GameItem type later)
						console.log('Behaviors updated:', behaviors);
					}}
					onClose={() => {
						showTriggerEditor = false;
						if (!showPropertyPanel) editingItem = null;
					}}
				/>
			{/if}
		</div>
	{/if}

	<!-- Sprite Editor Modal -->
	{#if showSpriteEditor}
		<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
			<SpriteEditor
				width={16}
				height={32}
				onSave={(data) => {
					itemCounter++;
					const item = createItem(`Item ${itemCounter}`, data);
					const slot = inventory.addItem(item);
					if (slot >= 0) {
						inventory.selectSlot(slot);
					}
					showSpriteEditor = false;
				}}
				onClose={() => (showSpriteEditor = false)}
			/>
		</div>
	{/if}
</div>
