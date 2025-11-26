<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 10 }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
	{#each Array(count) as _, i}
		<div class="aspect-square animate-pulse overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
			<!-- Skeleton shimmer effect -->
			<div class="h-full w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800"></div>
		</div>
	{/each}
</div>

<style>
	@keyframes shimmer {
		0% {
			background-position: -1000px 0;
		}
		100% {
			background-position: 1000px 0;
		}
	}

	.animate-pulse {
		animation: shimmer 2s infinite linear;
		background-size: 1000px 100%;
	}
</style>
