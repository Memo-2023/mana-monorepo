<script lang="ts" generics="T">
	import { onMount, type Snippet } from 'svelte';

	interface Props {
		items: T[];
		itemHeight: number;
		bufferSize?: number;
		onLoadMore?: () => void;
		loadMoreThreshold?: number;
		class?: string;
		children: Snippet<[{ item: T; index: number }]>;
	}

	let {
		items,
		itemHeight,
		bufferSize = 5,
		onLoadMore,
		loadMoreThreshold = 200,
		class: className = '',
		children,
	}: Props = $props();

	// State
	let containerElement: HTMLDivElement;
	let scrollTop = $state(0);
	let containerHeight = $state(0);

	// Derived calculations
	let totalHeight = $derived(items.length * itemHeight);

	let startIndex = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize));

	let endIndex = $derived(
		Math.min(
			items.length,
			Math.floor(scrollTop / itemHeight) + Math.ceil(containerHeight / itemHeight) + bufferSize
		)
	);

	let visibleItems = $derived(
		items.slice(startIndex, endIndex).map((item, i) => ({
			item,
			index: startIndex + i,
			style: `position: absolute; top: ${(startIndex + i) * itemHeight}px; left: 0; right: 0; height: ${itemHeight}px;`,
		}))
	);

	// Throttle scroll handler for performance
	let scrollThrottleTimer: ReturnType<typeof setTimeout> | null = null;
	let pendingScrollTop = 0;
	let isLoadMorePending = false;

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		pendingScrollTop = target.scrollTop;

		// Check if we should load more (immediate check)
		if (onLoadMore && !isLoadMorePending) {
			const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
			if (scrollBottom < loadMoreThreshold) {
				isLoadMorePending = true;
				onLoadMore();
				// Reset after a short delay to prevent multiple calls
				setTimeout(() => {
					isLoadMorePending = false;
				}, 500);
			}
		}

		// Throttle the scroll state update
		if (!scrollThrottleTimer) {
			scrollThrottleTimer = setTimeout(() => {
				scrollTop = pendingScrollTop;
				scrollThrottleTimer = null;
			}, 16); // ~60fps
		}
	}

	// Initialize container height
	onMount(() => {
		if (containerElement) {
			containerHeight = containerElement.clientHeight;

			// Set up resize observer
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					containerHeight = entry.contentRect.height;
				}
			});

			resizeObserver.observe(containerElement);

			return () => {
				resizeObserver.disconnect();
				// Clean up throttle timer
				if (scrollThrottleTimer) {
					clearTimeout(scrollThrottleTimer);
				}
			};
		}
	});
</script>

<div
	bind:this={containerElement}
	onscroll={handleScroll}
	class="virtual-list-container {className}"
>
	<div class="virtual-list-content" style="height: {totalHeight}px; position: relative;">
		{#each visibleItems as { item, index, style } (index)}
			<div {style}>
				{@render children({ item, index })}
			</div>
		{/each}
	</div>
</div>

<style>
	.virtual-list-container {
		overflow-y: auto;
		height: 100%;
		/* Hide scrollbar */
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.virtual-list-container::-webkit-scrollbar {
		display: none;
	}
</style>
