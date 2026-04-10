<!--
  ResizeHandle — Draggable divider between split-screen panels.
  On mousedown, tracks mouse X and emits percentage position.
-->
<script lang="ts">
	let { onResize }: { onResize: (position: number) => void } = $props();

	let isDragging = $state(false);

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		isDragging = true;

		const handleMouseMove = (moveEvent: MouseEvent) => {
			const percentage = (moveEvent.clientX / window.innerWidth) * 100;
			onResize(percentage);
		};

		const handleMouseUp = () => {
			isDragging = false;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleTouchStart(e: TouchEvent) {
		e.preventDefault();
		isDragging = true;

		const handleTouchMove = (moveEvent: TouchEvent) => {
			const touch = moveEvent.touches[0];
			const percentage = (touch.clientX / window.innerWidth) * 100;
			onResize(percentage);
		};

		const handleTouchEnd = () => {
			isDragging = false;
			window.removeEventListener('touchmove', handleTouchMove);
			window.removeEventListener('touchend', handleTouchEnd);
		};

		window.addEventListener('touchmove', handleTouchMove);
		window.addEventListener('touchend', handleTouchEnd);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="group relative flex w-1.5 shrink-0 cursor-col-resize items-center justify-center
		hover:bg-white/10 {isDragging ? 'bg-white/15' : 'bg-white/5'}"
	onmousedown={handleMouseDown}
	ontouchstart={handleTouchStart}
	role="separator"
	aria-orientation="vertical"
	tabindex={0}
>
	<div
		class="h-8 w-0.5 rounded-full bg-white/20 transition-colors group-hover:bg-white/40
			{isDragging ? 'bg-white/50' : ''}"
	></div>
</div>

{#if isDragging}
	<!-- Overlay to prevent pointer events on iframes/panels during drag -->
	<div class="fixed inset-0 z-50 cursor-col-resize" style="background: transparent;"></div>
{/if}
