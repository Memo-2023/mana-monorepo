<script lang="ts">
	import type { FigureResponse } from '@figgos/shared';
	import { api } from '$lib/api';

	let figures = $state<FigureResponse[]>([]);
	let loading = $state(true);

	$effect(() => {
		api.figures
			.list()
			.then(({ figures: f }) => (figures = f))
			.finally(() => (loading = false));
	});

	let activeIndex = $state(0);
	let scrollContainer: HTMLDivElement;

	function handleScroll() {
		if (!scrollContainer) return;
		const children = Array.from(scrollContainer.querySelectorAll('[data-card]'));
		const scrollCenter = scrollContainer.scrollLeft + scrollContainer.clientWidth / 2;

		let closest = 0;
		let closestDist = Infinity;

		for (let i = 0; i < children.length; i++) {
			const child = children[i] as HTMLElement;
			const childCenter = child.offsetLeft + child.clientWidth / 2;
			const dist = Math.abs(scrollCenter - childCenter);
			if (dist < closestDist) {
				closestDist = dist;
				closest = i;
			}
		}
		activeIndex = closest;
	}

	// Pointer drag-to-scroll (works for mouse + touch)
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let scrollStartLeft = $state(0);
	let hasDragged = $state(false);

	function handlePointerDown(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		e.preventDefault();
		isDragging = true;
		hasDragged = false;
		dragStartX = e.clientX;
		scrollStartLeft = scrollContainer.scrollLeft;
		scrollContainer.style.scrollSnapType = 'none';
		scrollContainer.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const dx = e.clientX - dragStartX;
		if (Math.abs(dx) > 5) hasDragged = true;
		scrollContainer.scrollLeft = scrollStartLeft - dx;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;
		scrollContainer.releasePointerCapture(e.pointerId);
		scrollContainer.style.scrollSnapType = '';

		const children = Array.from(scrollContainer.querySelectorAll('[data-card]'));
		const scrollCenter = scrollContainer.scrollLeft + scrollContainer.clientWidth / 2;
		let closest: HTMLElement | null = null;
		let closestDist = Infinity;

		for (const child of children) {
			const el = child as HTMLElement;
			const childCenter = el.offsetLeft + el.clientWidth / 2;
			const dist = Math.abs(scrollCenter - childCenter);
			if (dist < closestDist) {
				closestDist = dist;
				closest = el;
			}
		}

		if (closest) {
			const targetScroll =
				closest.offsetLeft - (scrollContainer.clientWidth - closest.clientWidth) / 2;
			scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
		}
	}

	function handleClick(e: MouseEvent) {
		if (hasDragged) {
			e.preventDefault();
		}
	}
</script>

{#if loading}
	<div class="flex h-[calc(100dvh-72px)] items-center justify-center">
		<svg class="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	</div>
{:else if figures.length === 0}
	<div class="flex h-[calc(100dvh-72px)] items-center justify-center">
		<p class="text-lg font-bold text-muted-foreground">No figures yet</p>
	</div>
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="showcase-scroll h-[calc(100dvh-72px)] w-full"
		class:cursor-grabbing={isDragging}
		bind:this={scrollContainer}
		onscroll={handleScroll}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
	>
		{#each figures as figure, i (figure.id)}
			<a
				href="/card/{figure.id}"
				class="showcase-card h-full transition-all duration-300"
				data-card
				onclick={handleClick}
				style="
					transform: scale({i === activeIndex ? 1 : 0.8}) rotate({i === activeIndex
					? 0
					: i < activeIndex
						? -3
						: 3}deg);
					opacity: {i === activeIndex ? 1 : 0.45};
				"
			>
				{#if figure.imageUrl}
					<img
						src={figure.imageUrl}
						alt={figure.name}
						class="max-h-[85%] w-auto max-w-full object-contain"
						draggable="false"
					/>
				{:else}
					<div
						class="flex h-[60%] w-[80%] flex-col items-center justify-center rounded-xl border-2 border-border-muted bg-surface"
					>
						<span class="text-lg font-black text-foreground">{figure.name}</span>
						<span class="mt-1 text-sm text-muted-foreground">No image</span>
					</div>
				{/if}
			</a>
		{/each}
	</div>
{/if}

<style>
	.showcase-scroll {
		display: flex;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		align-items: center;
		gap: 0;
		cursor: grab;
		user-select: none;
	}
	.showcase-scroll::-webkit-scrollbar {
		display: none;
	}
	.showcase-scroll::before,
	.showcase-scroll::after {
		content: '';
		flex-shrink: 0;
		width: 20%;
	}
	.showcase-card {
		flex-shrink: 0;
		width: 60%;
		scroll-snap-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		touch-action: pan-x;
	}
</style>
