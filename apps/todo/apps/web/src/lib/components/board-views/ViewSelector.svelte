<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID, type DndEvent } from 'svelte-dnd-action';
	import type { LocalBoardView } from '$lib/data/local-store';

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

	// Map icon names to simple SVG representations
	const iconMap: Record<string, string> = {
		columns: 'M9 4h6v16H9zM3 4h4v16H3zM17 4h4v16h-4z',
		'grid-four': 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
		flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
		folders: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
		calendar:
			'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
		list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
		star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
		tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
		clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
		target:
			'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z',
		lightning: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z',
		heart:
			'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
	};

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
					{#if view.icon && iconMap[view.icon]}
						<svg
							class="h-4 w-4 mr-1.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d={iconMap[view.icon]} />
						</svg>
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
							<svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
								<circle cx="12" cy="5" r="2" />
								<circle cx="12" cy="12" r="2" />
								<circle cx="12" cy="19" r="2" />
							</svg>
						</button>
					{/if}
				</button>
			{/each}
		</div>

		{#if onCreate}
			<button type="button" class="view-pill add-pill" onclick={onCreate}>
				<svg
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 5v14M5 12h14" />
				</svg>
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
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
				<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
			</svg>
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
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.75rem;
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.15),
			0 4px 6px -2px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .context-menu {
		background: rgba(30, 30, 40, 0.95);
		border-color: rgba(255, 255, 255, 0.12);
	}

	.context-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.1s;
	}

	.context-item:hover {
		background: rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .context-item {
		color: #e5e7eb;
	}

	:global(.dark) .context-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
