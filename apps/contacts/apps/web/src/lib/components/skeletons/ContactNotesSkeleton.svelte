<script lang="ts">
	/**
	 * ContactNotesSkeleton - Skeleton for contact notes loading
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="notes-skeleton" role="status" aria-label="Notizen werden geladen...">
	{#each Array(3) as _, i}
		<div class="note-item" style="opacity: {Math.max(0.4, 1 - i * 0.25)};">
			<div class="note-content">
				<SkeletonBox width="85%" height="14px" />
				<SkeletonBox width="60%" height="14px" />
			</div>
			<SkeletonBox width="50px" height="12px" />
		</div>
	{/each}
</div>

<style>
	.notes-skeleton {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.note-item {
		padding: 0.75rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.5rem;
	}

	.note-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
</style>
