<script lang="ts">
	/**
	 * ContactDetailSkeleton - Skeleton for contact detail modal loading
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="contact-detail-skeleton" role="status" aria-label="Kontakt wird geladen...">
	<!-- Profile Header -->
	<div class="profile-header">
		<div class="avatar-wrapper">
			<SkeletonBox width="100px" height="100px" borderRadius="50%" />
		</div>
		<SkeletonBox width="180px" height="24px" />
		<SkeletonBox width="140px" height="16px" />
	</div>

	<!-- Quick Actions -->
	<div class="quick-actions">
		{#each Array(3) as _}
			<div class="quick-action-skeleton">
				<SkeletonBox width="40px" height="40px" borderRadius="50%" />
				<SkeletonBox width="48px" height="12px" />
			</div>
		{/each}
	</div>

	<!-- Details Sections -->
	<div class="details-container">
		<!-- Contact Section -->
		<div class="detail-section">
			<div class="section-header-skeleton">
				<SkeletonBox width="28px" height="28px" borderRadius="6px" />
				<SkeletonBox width="80px" height="16px" />
			</div>
			<div class="detail-items">
				{#each Array(3) as _, i}
					<div class="detail-item" style="opacity: {Math.max(0.5, 1 - i * 0.15)};">
						<div class="detail-content">
							<SkeletonBox width="50px" height="12px" />
							<SkeletonBox width="65%" height="16px" />
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Work Section -->
		<div class="detail-section">
			<div class="section-header-skeleton">
				<SkeletonBox width="28px" height="28px" borderRadius="6px" />
				<SkeletonBox width="60px" height="16px" />
			</div>
			<div class="detail-items">
				{#each Array(2) as _, i}
					<div class="detail-item" style="opacity: {Math.max(0.5, 1 - i * 0.2)};">
						<div class="detail-content">
							<SkeletonBox width="45px" height="12px" />
							<SkeletonBox width="55%" height="16px" />
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Address Section -->
		<div class="detail-section">
			<div class="section-header-skeleton">
				<SkeletonBox width="28px" height="28px" borderRadius="6px" />
				<SkeletonBox width="70px" height="16px" />
			</div>
			<div class="address-skeleton">
				<SkeletonBox width="75%" height="16px" />
				<SkeletonBox width="50%" height="16px" />
				<SkeletonBox width="40%" height="16px" />
			</div>
		</div>
	</div>
</div>

<style>
	.contact-detail-skeleton {
		display: flex;
		flex-direction: column;
	}

	.profile-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 0;
		gap: 0.75rem;
	}

	.avatar-wrapper {
		margin-bottom: 0.5rem;
	}

	.quick-actions {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		padding-bottom: 1.25rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.quick-action-skeleton {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}

	.details-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-section {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.875rem;
		padding: 1rem;
	}

	.section-header-skeleton {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding-bottom: 0.625rem;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
		margin-bottom: 0.625rem;
	}

	.detail-items {
		display: flex;
		flex-direction: column;
	}

	.detail-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.3);
	}

	.detail-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.detail-item:first-child {
		padding-top: 0;
	}

	.detail-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.address-skeleton {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.625rem 0.875rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.5rem;
	}
</style>
