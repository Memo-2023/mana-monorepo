<script lang="ts">
	/**
	 * SkeletonText - Text-Linien Skeleton
	 *
	 * Vordefinierte Komponente für Text-Zeilen mit verschiedenen Größen
	 */

	import SkeletonBox from './SkeletonBox.svelte';

	interface Props {
		lines?: number;
		width?: string[];
		variant?: 'body' | 'heading' | 'caption';
		className?: string;
	}

	let { lines = 2, width = ['100%', '80%'], variant = 'body', className = '' }: Props = $props();

	const heights = {
		heading: '24px',
		body: '16px',
		caption: '12px',
	};

	const height = heights[variant];
</script>

<div class="skeleton-text {className}">
	{#each Array(lines) as _, i}
		<SkeletonBox width={width[i] || width[width.length - 1]} {height} className="mb-2" />
	{/each}
</div>
