<script lang="ts">
	/**
	 * SubscriptionPageSkeleton - Full-page Skeleton für Subscription/Mana Seite
	 *
	 * Zeigt Platzhalter für Usage Card, Cost Card, und Subscription/Package Cards
	 */

	import SkeletonBox from '../utils/SkeletonBox.svelte';

	interface Props {
		showUsageSection?: boolean;
		subscriptionCount?: number;
		packageCount?: number;
	}

	let { showUsageSection = true, subscriptionCount = 4, packageCount = 3 }: Props = $props();
</script>

<div class="flex h-full flex-col">
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl pb-12">
			<!-- Header -->
			<SkeletonBox width="200px" height="36px" className="mb-8" />

			{#if showUsageSection}
				<!-- Usage & Costs Section -->
				<section class="mb-8 space-y-4">
					<!-- Usage Card -->
					<div class="rounded-2xl border border-theme bg-menu p-6">
						<SkeletonBox width="150px" height="20px" className="mb-6" />

						<!-- Progress Bars -->
						<div class="space-y-5">
							{#each [1, 2] as _}
								<div>
									<div class="mb-2 flex justify-between">
										<SkeletonBox width="80px" height="14px" />
										<SkeletonBox width="100px" height="14px" />
									</div>
									<SkeletonBox width="100%" height="8px" borderRadius="4px" />
								</div>
							{/each}
						</div>
					</div>

					<!-- Cost Card -->
					<div class="rounded-2xl border border-theme bg-menu p-6">
						<SkeletonBox width="180px" height="20px" className="mb-6" />

						<!-- Cost Items -->
						<div class="space-y-3">
							{#each [1, 2, 3, 4] as _, i}
								<div
									class="flex items-center justify-between rounded-lg border border-theme p-3"
									style="opacity: {Math.max(0.5, 1 - i * 0.1)};"
								>
									<div class="flex items-center gap-3">
										<SkeletonBox width="32px" height="32px" borderRadius="6px" />
										<SkeletonBox width="140px" height="14px" />
									</div>
									<SkeletonBox width="60px" height="16px" />
								</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<!-- Billing Toggle -->
			<div class="mb-8 flex justify-center">
				<SkeletonBox width="280px" height="48px" borderRadius="24px" />
			</div>

			<!-- Subscriptions Section -->
			<section class="mb-12">
				<SkeletonBox width="180px" height="28px" className="mb-6" />

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{#each Array(subscriptionCount) as _, i}
						<div
							class="rounded-2xl border border-theme bg-menu p-6"
							style="opacity: {Math.max(0.4, 1 - i * 0.12)};"
						>
							<!-- Plan Name & Badge -->
							<div class="mb-4 flex items-center justify-between">
								<SkeletonBox width="100px" height="24px" />
								<SkeletonBox width="70px" height="24px" borderRadius="12px" />
							</div>

							<!-- Price -->
							<div class="mb-6">
								<SkeletonBox width="120px" height="40px" className="mb-2" />
								<SkeletonBox width="80px" height="12px" />
							</div>

							<!-- Features -->
							<div class="mb-6 space-y-3">
								{#each [1, 2, 3, 4] as _}
									<div class="flex items-center gap-2">
										<SkeletonBox width="16px" height="16px" borderRadius="50%" />
										<SkeletonBox width="140px" height="12px" />
									</div>
								{/each}
							</div>

							<!-- Button -->
							<SkeletonBox width="100%" height="44px" borderRadius="8px" />
						</div>
					{/each}
				</div>
			</section>

			<!-- Packages Section -->
			<section class="mb-12">
				<SkeletonBox width="160px" height="28px" className="mb-6" />

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each Array(packageCount) as _, i}
						<div
							class="rounded-2xl border border-theme bg-menu p-6"
							style="opacity: {Math.max(0.5, 1 - i * 0.15)};"
						>
							<!-- Icon -->
							<div class="mb-4 flex justify-center">
								<SkeletonBox width="48px" height="48px" borderRadius="50%" />
							</div>

							<!-- Package Name -->
							<SkeletonBox width="120px" height="20px" className="mb-3 mx-auto" />

							<!-- Amount -->
							<SkeletonBox width="100px" height="32px" className="mb-4 mx-auto" />

							<!-- Price -->
							<SkeletonBox width="80px" height="24px" className="mb-6 mx-auto" />

							<!-- Button -->
							<SkeletonBox width="100%" height="44px" borderRadius="8px" />
						</div>
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>
