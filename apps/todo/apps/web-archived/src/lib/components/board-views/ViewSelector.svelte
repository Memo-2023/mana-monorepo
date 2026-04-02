<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID, type DndEvent } from 'svelte-dnd-action';
	import type { LocalBoardView } from '$lib/data/local-store';
	import {
		DotsThreeVertical,
		Plus,
		PencilSimple,
		Columns,
		GridFour,
		Flag,
		Folder,
		CalendarBlank,
		List,
		Star,
		Tag,
		Clock,
		Crosshair,
		Lightning,
		Heart,
	} from '@manacore/shared-icons';
	import type { ComponentType } from 'svelte';

	// Map icon names to Phosphor components
	const phosphorIconMap: Record<string, ComponentType> = {
		columns: Columns,
		'grid-four': GridFour,
		flag: Flag,
		folders: Folder,
		calendar: CalendarBlank,
		list: List,
		star: Star,
		tag: Tag,
		clock: Clock,
		target: Crosshair,
		lightning: Lightning,
		heart: Heart,
	};

	interface Props {
		views: LocalBoardView[];
		activeViewId: string | null;
		onSelect: (viewId: string) => void;
		onCreate?: () => void;
		onEdit?: (view: LocalBoardView) => void;
		onReorder?: (viewIds: string[]) => void;
	}

	let { views, activeViewId, onSelect, onCreate, onEdit, onReorder }: Props = $props();

	// Local state for DnD
	let localViews = $state<LocalBoardView[]>([]);

	$effect(() => {
		localViews = [...views];
	});

	const flipDurationMs = 150;

	function handleDndConsider(e: CustomEvent<DndEvent<LocalBoardView>>) {
		localViews = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<LocalBoardView>>) {
		localViews = e.detail.items.filter((v) => v.id !== SHADOW_PLACEHOLDER_ITEM_ID);
		if (onReorder) {
			onReorder(localViews.map((v) => v.id));
		}
	}

	// Context menu state
	let contextMenuViewId = $state<string | null>(null);
	let contextMenuPos = $state({ x: 0, y: 0 });

	function handleContextMenu(e: MouseEvent, view: LocalBoardView) {
		e.preventDefault();
		e.stopPropagation();
		contextMenuViewId = view.id;
		contextMenuPos = { x: e.clientX, y: e.clientY };
	}

	function handleMoreClick(e: MouseEvent, view: LocalBoardView) {
		e.stopPropagation();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		contextMenuViewId = view.id;
		contextMenuPos = { x: rect.left, y: rect.bottom + 4 };
	}

	function handleEditClick() {
		const view = views.find((v) => v.id === contextMenuViewId);
		contextMenuViewId = null;
		if (view && onEdit) {
			onEdit(view);
		}
	}

	function closeContextMenu() {
		contextMenuViewId = null;
	}
</script>

<svelte:window onclick={closeContextMenu} />

<div class="view-selector-container">
	<div class="view-selector">
		<div
			class="view-pills-scroll"
			use:dndzone={{
				items: localViews,
				flipDurationMs,
				dropTargetStyle: {},
				type: 'view-pills',
				morphDisabled: true,
			}}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
		>
			{#each localViews.filter((v) => v.id !== SHADOW_PLACEHOLDER_ITEM_ID) as view (view.id)}
				<button
					type="button"
					class="view-pill"
					class:active={activeViewId === view.id}
					onclick={() => onSelect(view.id)}
					oncontextmenu={(e) => handleContextMenu(e, view)}
				>
					{#if view.icon && phosphorIconMap[view.icon]}
						{@const IconComponent = phosphorIconMap[view.icon]}
						<span class="mr-1.5"><IconComponent size={16} /></span>
					{:else if view.icon}
						<span class="mr-1.5 text-sm">{view.icon}</span>
					{/if}
					<span class="view-name">{view.name}</span>

					{#if activeViewId === view.id && onEdit}
						<button
							type="button"
							class="more-btn"
							onclick={(e) => handleMoreClick(e, view)}
							aria-label="View-Optionen"
						>
							<DotsThreeVertical size={12} weight="bold" />
						</button>
					{/if}
				</button>
			{/each}
		</div>

		{#if onCreate}
			<button type="button" class="view-pill add-pill" onclick={onCreate}>
				<Plus size={16} />
			</button>
		{/if}
	</div>
</div>

<!-- Context Menu -->
{#if contextMenuViewId}
	<div
		class="context-menu"
		style="left: {contextMenuPos.x}px; top: {contextMenuPos.y}px;"
		role="menu"
	>
		<button type="button" class="context-item" role="menuitem" onclick={handleEditClick}>
			<PencilSimple size={16} />
			Bearbeiten
		</button>
	</div>
{/if}

<style>
	.view-selector-container {
		padding: 0 1rem;
		margin-bottom: 0.75rem;
	}

	@media (min-width: 640px) {
		.view-selector-container {
			padding: 0 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.view-selector-container {
			padding: 0 2rem;
		}
	}

	.view-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		/* Glass-Pill container */
		background: rgba(255, 255, 255, 0.65);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 9999px;
		padding: 0.375rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.07),
			0 2px 4px -1px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .view-selector {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.view-pills-scroll {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		overflow-x: auto;
		scroll-behavior: smooth;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.view-pills-scroll::-webkit-scrollbar {
		display: none;
	}

	.view-pill {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.view-pill:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .view-pill {
		color: #9ca3af;
	}

	:global(.dark) .view-pill:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #f3f4f6;
	}

	.view-pill.active {
		background: #8b5cf6;
		color: white;
		box-shadow:
			0 2px 4px -1px rgba(0, 0, 0, 0.15),
			0 1px 2px -1px rgba(0, 0, 0, 0.1);
	}

	.view-pill.active:hover {
		filter: brightness(1.1);
		color: white;
	}

	:global(.dark) .view-pill.active {
		background: #8b5cf6;
		color: white;
	}

	.view-name {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ─── Add Pill ──────────────────────────────────────────── */
	.add-pill {
		padding: 0.5rem;
		color: #9ca3af;
		opacity: 0.7;
	}

	.add-pill:hover {
		opacity: 1;
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
	}

	:global(.dark) .add-pill {
		color: #6b7280;
	}

	:global(.dark) .add-pill:hover {
		color: #a78bfa;
		background: rgba(139, 92, 246, 0.15);
	}

	/* ─── More Button (three dots) ──────────────────────────── */
	.more-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		margin-left: 0.25rem;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		transition: all 0.15s;
		padding: 0;
	}

	.more-btn:hover {
		color: white;
		background: rgba(255, 255, 255, 0.2);
	}

	/* ─── Context Menu ──────────────────────────────────────── */
	.context-menu {
		position: fixed;
		z-index: 200;
		min-width: 160px;
		padding: 0.375rem;
		background: var(--color-surface-elevated-3);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		box-shadow: var(--shadow-xl);
	}

	.context-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-foreground);
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.1s;
	}

	.context-item:hover {
		background: var(--color-surface-hover);
	}
</style>
