<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		percentage = 0,
		size = 100,
		strokeWidth = 8,
		color = 'var(--color-primary)',
		children,
	}: {
		percentage?: number;
		size?: number;
		strokeWidth?: number;
		color?: string;
		children?: Snippet;
	} = $props();

	let radius = $derived((size - strokeWidth) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	let offset = $derived(circumference - (Math.min(percentage, 100) / 100) * circumference);
</script>

<div class="relative" style="width: {size}px; height: {size}px;">
	<svg class="transform -rotate-90" width={size} height={size}>
		<!-- Background circle -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="var(--color-background-elevated)"
			stroke-width={strokeWidth}
		/>
		<!-- Progress circle -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={color}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			class="transition-all duration-500"
		/>
	</svg>

	<!-- Center content -->
	<div class="absolute inset-0 flex items-center justify-center">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
