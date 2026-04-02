<script lang="ts">
	import type { SpiralImage } from '@manacore/spiral-db';
	import { spiralToXY, xyToSpiral } from '@manacore/spiral-db';

	interface Props {
		image: SpiralImage;
		scale?: number;
		showGrid?: boolean;
		highlightIndex?: number | null;
		onPixelClick?: (index: number, x: number, y: number) => void;
	}

	let {
		image,
		scale = 10,
		showGrid = false,
		highlightIndex = null,
		onPixelClick,
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let hoveredIndex = $state<number | null>(null);

	$effect(() => {
		if (!canvas || !image) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { width, height, pixels } = image;
		canvas.width = width * scale;
		canvas.height = height * scale;

		ctx.fillStyle = '#1a1a1a';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const offset = (y * width + x) * 3;
				const r = pixels[offset];
				const g = pixels[offset + 1];
				const b = pixels[offset + 2];

				ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
				ctx.fillRect(x * scale, y * scale, scale, scale);
			}
		}

		if (showGrid && scale >= 8) {
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
			ctx.lineWidth = 1;

			for (let x = 0; x <= width; x++) {
				ctx.beginPath();
				ctx.moveTo(x * scale, 0);
				ctx.lineTo(x * scale, height * scale);
				ctx.stroke();
			}

			for (let y = 0; y <= height; y++) {
				ctx.beginPath();
				ctx.moveTo(0, y * scale);
				ctx.lineTo(width * scale, y * scale);
				ctx.stroke();
			}
		}

		const center = Math.floor(width / 2);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
		ctx.lineWidth = 2;
		ctx.strokeRect(center * scale, center * scale, scale, scale);

		if (highlightIndex !== null && highlightIndex >= 0) {
			const point = spiralToXY(highlightIndex, width);
			ctx.strokeStyle = '#fbbf24';
			ctx.lineWidth = 2;
			ctx.strokeRect(point.x * scale, point.y * scale, scale, scale);
		}

		if (hoveredIndex !== null) {
			const point = spiralToXY(hoveredIndex, width);
			ctx.strokeStyle = '#3b82f6';
			ctx.lineWidth = 2;
			ctx.strokeRect(point.x * scale, point.y * scale, scale, scale);
		}
	});

	function handleMouseMove(e: MouseEvent) {
		if (!canvas || !image) return;

		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / scale);
		const y = Math.floor((e.clientY - rect.top) / scale);

		if (x >= 0 && x < image.width && y >= 0 && y < image.height) {
			hoveredIndex = xyToSpiral(x, y, image.width);
		} else {
			hoveredIndex = null;
		}
	}

	function handleMouseLeave() {
		hoveredIndex = null;
	}

	function handleClick(e: MouseEvent) {
		if (!canvas || !image || !onPixelClick) return;

		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / scale);
		const y = Math.floor((e.clientY - rect.top) / scale);

		if (x >= 0 && x < image.width && y >= 0 && y < image.height) {
			const index = xyToSpiral(x, y, image.width);
			onPixelClick(index, x, y);
		}
	}
</script>

<div class="spiral-canvas-container">
	<canvas
		bind:this={canvas}
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
		onclick={handleClick}
		class="spiral-canvas"
		class:clickable={!!onPixelClick}
	></canvas>

	{#if hoveredIndex !== null}
		<div class="pixel-info">
			Pixel #{hoveredIndex}
		</div>
	{/if}
</div>

<style>
	.spiral-canvas-container {
		position: relative;
		display: inline-block;
	}

	.spiral-canvas {
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.spiral-canvas.clickable {
		cursor: pointer;
	}

	.pixel-info {
		position: absolute;
		bottom: -30px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-family: monospace;
		white-space: nowrap;
	}
</style>
