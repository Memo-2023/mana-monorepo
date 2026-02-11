<script lang="ts">
	import { CARDS } from '$lib/data/cards';

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
		// Only for mouse (touch already scrolls natively)
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

		// Re-snap to nearest card
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
			const targetScroll = closest.offsetLeft - (scrollContainer.clientWidth - closest.clientWidth) / 2;
			scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
		}
	}

	function handleClick(e: MouseEvent) {
		if (hasDragged) {
			e.preventDefault();
		}
	}
</script>

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
	/* Side padding so first/last card can center */
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
	{#each CARDS as card, i (card.id)}
		<a
			href="/card/{card.id}"
			class="showcase-card h-full transition-all duration-300"
			data-card
			onclick={handleClick}
			style="
				transform: scale({i === activeIndex ? 1 : 0.8}) rotate({i === activeIndex ? 0 : i < activeIndex ? -3 : 3}deg);
				opacity: {i === activeIndex ? 1 : 0.45};
			"
		>
			<img
				src={card.image}
				alt={card.name}
				class="max-h-[85%] w-auto max-w-full object-contain"
				draggable="false"
			/>
		</a>
	{/each}
</div>
