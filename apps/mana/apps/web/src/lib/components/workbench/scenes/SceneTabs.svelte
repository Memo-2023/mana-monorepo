<!--
  SceneTabs — pill bar above the workbench carousel listing the user's
  Scenes (named workbench layouts). Click a pill to switch, right-click for
  rename/duplicate/delete, drag to reorder, "+" to create.
-->
<script lang="ts">
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { Plus, Pencil, Copy, Trash } from '@mana/shared-icons';
	import type { WorkbenchScene } from '$lib/types/workbench-scenes';

	interface Props {
		scenes: WorkbenchScene[];
		activeSceneId: string | null;
		onSelect: (id: string) => void;
		onCreate: () => void;
		onRequestRename: (id: string) => void;
		onDuplicate: (id: string) => void;
		onRequestDelete: (id: string) => void;
		onReorder: (fromId: string, toId: string) => void;
	}

	let {
		scenes,
		activeSceneId,
		onSelect,
		onCreate,
		onRequestRename,
		onDuplicate,
		onRequestDelete,
		onReorder,
	}: Props = $props();

	// ── Context menu state (local to this component) ───────
	let menuVisible = $state(false);
	let menuX = $state(0);
	let menuY = $state(0);
	let menuItems = $state<ContextMenuItem[]>([]);

	function openMenu(e: MouseEvent, scene: WorkbenchScene) {
		e.preventDefault();
		const items: ContextMenuItem[] = [
			{
				id: 'rename',
				label: 'Umbenennen',
				icon: Pencil,
				action: () => onRequestRename(scene.id),
			},
			{
				id: 'duplicate',
				label: 'Duplizieren',
				icon: Copy,
				action: () => onDuplicate(scene.id),
			},
		];
		// Only allow delete if more than one scene exists.
		if (scenes.length > 1) {
			items.push({ id: 'div', label: '', type: 'divider' });
			items.push({
				id: 'delete',
				label: 'Löschen',
				icon: Trash,
				variant: 'danger',
				action: () => onRequestDelete(scene.id),
			});
		}
		menuItems = items;
		menuX = e.clientX;
		menuY = e.clientY;
		menuVisible = true;
	}

	// ── Drag reorder ────────────────────────────────────────
	let dragId = $state<string | null>(null);

	function handleDragStart(e: DragEvent, id: string) {
		dragId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}
	function handleDragOver(e: DragEvent) {
		if (!dragId) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}
	function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		if (!dragId || dragId === targetId) return;
		onReorder(dragId, targetId);
		dragId = null;
	}
	function handleDragEnd() {
		dragId = null;
	}
</script>

<div class="scene-tabs">
	<div class="scene-tabs-scroll">
		{#each scenes as scene (scene.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<button
				type="button"
				class="scene-pill"
				class:active={scene.id === activeSceneId}
				class:dragging={dragId === scene.id}
				draggable="true"
				ondragstart={(e) => handleDragStart(e, scene.id)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, scene.id)}
				ondragend={handleDragEnd}
				onclick={() => onSelect(scene.id)}
				ondblclick={() => onRequestRename(scene.id)}
				oncontextmenu={(e) => openMenu(e, scene)}
				title={scene.name}
			>
				{#if scene.icon}
					<span class="scene-icon">{scene.icon}</span>
				{/if}
				<span class="scene-name">{scene.name}</span>
			</button>
		{/each}
		<button type="button" class="scene-add" onclick={onCreate} title="Neue Szene">
			<Plus size={14} />
		</button>
	</div>
</div>

<ContextMenu
	visible={menuVisible}
	x={menuX}
	y={menuY}
	items={menuItems}
	onClose={() => (menuVisible = false)}
/>

<style>
	.scene-tabs {
		display: flex;
		justify-content: center;
		padding: 0.5rem 1rem 0;
	}
	.scene-tabs-scroll {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
		padding: 0.25rem;
		border-radius: 0.625rem;
		background: hsl(var(--color-surface-hover));
	}
	.scene-tabs-scroll::-webkit-scrollbar {
		display: none;
	}

	.scene-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		flex: 0 0 auto;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
		max-width: 180px;
	}
	.scene-pill:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.scene-pill.active {
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
	}
	.scene-pill.dragging {
		opacity: 0.4;
	}
	.scene-icon {
		font-size: 0.95rem;
		line-height: 1;
	}
	.scene-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.scene-add {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		padding: 0.375rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.scene-add:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-primary));
	}
</style>
