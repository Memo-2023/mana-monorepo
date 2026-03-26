<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 6 }: Props = $props();
</script>

<div class="skeleton-list" role="status" aria-label="Dateien werden geladen">
	{#each Array(count) as _, i}
		<div class="skeleton-row" style="opacity: {1 - i * 0.1}">
			<div class="skeleton-icon shimmer"></div>
			<div class="skeleton-name shimmer"></div>
			<div class="skeleton-size shimmer"></div>
			<div class="skeleton-date shimmer"></div>
		</div>
	{/each}
</div>

<style>
	.skeleton-list {
		display: flex;
		flex-direction: column;
	}

	.skeleton-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.skeleton-icon {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.skeleton-name {
		flex: 1;
		height: 14px;
		max-width: 200px;
		border-radius: var(--radius-sm);
	}

	.skeleton-size {
		width: 60px;
		height: 12px;
		border-radius: var(--radius-sm);
	}

	.skeleton-date {
		width: 100px;
		height: 12px;
		border-radius: var(--radius-sm);
	}

	.shimmer {
		background: linear-gradient(
			90deg,
			rgb(var(--color-border) / 0.3) 25%,
			rgb(var(--color-border) / 0.6) 50%,
			rgb(var(--color-border) / 0.3) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (max-width: 640px) {
		.skeleton-date {
			display: none;
		}
	}
</style>
