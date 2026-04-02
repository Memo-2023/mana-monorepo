<script lang="ts">
	/**
	 * TagsPageSkeleton - Skeleton für Tags Content
	 *
	 * Zeigt NUR die Tag Pills - Header wird bereits von der Seite gerendert!
	 * Matched exakt die Struktur der echten Tag Pills
	 */

	import SkeletonBox from '../utils/SkeletonBox.svelte';

	interface Props {
		tagCount?: number;
	}

	let { tagCount = 15 }: Props = $props();

	// Generate realistic tag widths (Tag names vary in length)
	const tagWidths = Array.from({ length: tagCount }, () => {
		// Real tags: ~60px - 160px for the text
		return Math.floor(Math.random() * 100) + 60;
	});
</script>

<!-- Exakt wie auf echter Seite: flex flex-wrap gap-4 -->
<div class="flex flex-wrap gap-4">
	{#each tagWidths as width, i}
		<!-- Exakt wie echter Tag: group inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 text-base font-medium -->
		<div
			class="group inline-flex items-center gap-2 rounded-full border-2 border-theme bg-menu px-5 py-3"
			style="opacity: {Math.max(0.5, 1 - i * 0.03)};"
		>
			<!-- Tag Name Text (text-base = 16px height) -->
			<SkeletonBox width="{width}px" height="16px" borderRadius="3px" />

			<!-- Edit Button: rounded-full p-1 mit h-4 w-4 Icon -->
			<div class="rounded-full p-1">
				<SkeletonBox width="16px" height="16px" borderRadius="2px" />
			</div>
		</div>
	{/each}
</div>
