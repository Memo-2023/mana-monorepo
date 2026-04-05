<script lang="ts">
	import { SkeletonBox } from '@mana/shared-ui';
</script>

<div class="app-loading-skeleton" role="status" aria-label="App wird geladen...">
	<div class="header-skeleton">
		<SkeletonBox width="120px" height="32px" borderRadius="8px" />
		<div class="header-nav">
			<SkeletonBox width="80px" height="32px" borderRadius="16px" />
			<SkeletonBox width="80px" height="32px" borderRadius="16px" />
		</div>
		<SkeletonBox width="36px" height="36px" borderRadius="50%" />
	</div>

	<div class="content-skeleton">
		<div class="games-placeholder">
			{#each Array(6) as _}
				<SkeletonBox width="100%" height="200px" borderRadius="12px" />
			{/each}
		</div>
	</div>
</div>

<style>
	.app-loading-skeleton {
		min-height: 100vh;
		background: hsl(var(--background));
	}

	.header-skeleton {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.header-nav {
		display: flex;
		gap: 0.5rem;
	}

	.content-skeleton {
		max-width: 80rem;
		margin: 0 auto;
		padding: 2rem;
	}

	.games-placeholder {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		.header-nav {
			display: none;
		}

		.header-skeleton {
			padding: 1rem;
		}

		.content-skeleton {
			padding: 1rem;
		}

		.games-placeholder {
			grid-template-columns: 1fr;
		}
	}
</style>
