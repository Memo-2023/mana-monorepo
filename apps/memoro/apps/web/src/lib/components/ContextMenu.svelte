<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface MenuItem {
		label: string;
		icon?: string;
		action: () => void;
		danger?: boolean;
		separator?: boolean;
	}

	interface Props {
		items: MenuItem[];
		x: number;
		y: number;
		onClose: () => void;
	}

	let { items, x, y, onClose }: Props = $props();

	let menuElement: HTMLDivElement;
	let adjustedX = $state(x);
	let adjustedY = $state(y);
	let selectedIndex = $state(-1);

	// Get indices of non-separator items
	const selectableIndices = $derived(
		items
			.map((item, index) => ({ item, index }))
			.filter(({ item }) => !item.separator)
			.map(({ index }) => index)
	);

	onMount(() => {
		// Focus menu element so it can receive keyboard events
		menuElement?.focus();

		// Adjust position if menu would overflow viewport
		if (menuElement) {
			const rect = menuElement.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Adjust X if overflowing right
			if (x + rect.width > viewportWidth) {
				adjustedX = viewportWidth - rect.width - 10;
			}

			// Adjust Y if overflowing bottom
			if (y + rect.height > viewportHeight) {
				adjustedY = viewportHeight - rect.height - 10;
			}
		}

		// Close on click outside
		function handleClickOutside(e: MouseEvent) {
			if (menuElement && !menuElement.contains(e.target as Node)) {
				onClose();
			}
		}

		// Handle keyboard navigation
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				onClose();
				return;
			}

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				// Find next selectable index
				const currentPos = selectableIndices.indexOf(selectedIndex);
				const nextPos = currentPos + 1;
				if (nextPos < selectableIndices.length) {
					selectedIndex = selectableIndices[nextPos];
				} else {
					// Wrap to first item
					selectedIndex = selectableIndices[0];
				}
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				// Find previous selectable index
				const currentPos = selectableIndices.indexOf(selectedIndex);
				const prevPos = currentPos - 1;
				if (prevPos >= 0) {
					selectedIndex = selectableIndices[prevPos];
				} else {
					// Wrap to last item
					selectedIndex = selectableIndices[selectableIndices.length - 1];
				}
			} else if (e.key === 'Enter') {
				e.preventDefault();
				// Execute selected item
				if (selectedIndex >= 0 && selectedIndex < items.length) {
					const item = items[selectedIndex];
					if (!item.separator) {
						item.action();
						onClose();
					}
				}
			}
		}

		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	function handleItemClick(item: MenuItem) {
		if (!item.separator) {
			item.action();
			onClose();
		}
	}
</script>

<div
	bind:this={menuElement}
	class="context-menu"
	style="left: {adjustedX}px; top: {adjustedY}px;"
	tabindex="-1"
>
	{#each items as item, i (i)}
		{#if item.separator}
			<div class="separator"></div>
		{:else}
			<button
				class="menu-item"
				class:danger={item.danger}
				class:selected={selectedIndex === i}
				onclick={() => handleItemClick(item)}
				onmouseenter={() => (selectedIndex = i)}
			>
				{#if item.icon}
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if item.icon === 'edit'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						{:else if item.icon === 'delete'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						{:else if item.icon === 'share'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
							/>
						{:else if item.icon === 'download'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						{:else if item.icon === 'duplicate'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						{:else if item.icon === 'open'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						{:else if item.icon === 'pin'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
							/>
						{/if}
					</svg>
				{/if}
				<span>{item.label}</span>
			</button>
		{/if}
	{/each}
</div>

<style>
	.context-menu {
		position: fixed;
		z-index: 9999;
		min-width: 200px;
		background-color: #ffffff; /* lume.contentBackground */
		border: 1px solid #e6e6e6; /* lume.border */
		border-radius: 0.5rem;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		padding: 0.25rem;
		animation: fadeIn 0.15s ease-out;
		outline: none;
	}

	:global(.dark) .context-menu {
		background-color: #1e1e1e; /* dark.lume.contentBackground */
		border-color: #424242; /* dark.lume.border */
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.3),
			0 4px 6px -2px rgba(0, 0, 0, 0.2);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		font-size: 0.875rem;
		color: #2c2c2c; /* lume.text */
	}

	:global(.dark) .menu-item {
		color: #ffffff; /* dark.lume.text */
	}

	.menu-item:hover,
	.menu-item.selected {
		background-color: #f5f5f5; /* lume.contentBackgroundHover */
	}

	:global(.dark) .menu-item:hover,
	:global(.dark) .menu-item.selected {
		background-color: #333333; /* dark.lume.contentBackgroundHover */
	}

	.menu-item.danger {
		color: #e74c3c; /* lume.error */
	}

	:global(.dark) .menu-item.danger {
		color: #e74c3c; /* dark.lume.error */
	}

	.menu-item.danger:hover,
	.menu-item.danger.selected {
		background-color: rgba(231, 76, 60, 0.1);
	}

	:global(.dark) .menu-item.danger:hover,
	:global(.dark) .menu-item.danger.selected {
		background-color: rgba(231, 76, 60, 0.2);
	}

	.icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.separator {
		height: 1px;
		background-color: #e6e6e6; /* lume.border */
		margin: 0.25rem 0;
	}

	:global(.dark) .separator {
		background-color: #424242; /* dark.lume.border */
	}
</style>
