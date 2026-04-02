<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 8 }: Props = $props();
</script>

<div class="skeleton-grid" role="status" aria-label="Dateien werden geladen">
	{#each Array(count) as _, i}
		<div class="skeleton-card" style="opacity: {1 - i * 0.08}">
			<div class="skeleton-icon shimmer"></div>
			<div class="skeleton-name shimmer"></div>
			<div class="skeleton-size shimmer"></div>
		</div>
	{/each}
</div>

<style>
	.skeleton-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
	}

	.skeleton-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.25rem 1rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-lg);
	}

	.skeleton-icon {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
	}

	.skeleton-name {
		width: 80%;
		height: 14px;
		border-radius: var(--radius-sm);
	}

	.skeleton-size {
		width: 40%;
		height: 11px;
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
</style>
