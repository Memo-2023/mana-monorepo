<script lang="ts">
	import { SkeletonBox } from '@manacore/shared-ui';
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
		<div class="calc-placeholder">
			<SkeletonBox width="360px" height="80px" borderRadius="12px" />
			<div class="buttons-placeholder">
				{#each Array(16) as _}
					<SkeletonBox width="72px" height="56px" borderRadius="8px" />
				{/each}
			</div>
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 80px);
		gap: 2rem;
	}

	.calc-placeholder {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.buttons-placeholder {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
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
	}
</style>
