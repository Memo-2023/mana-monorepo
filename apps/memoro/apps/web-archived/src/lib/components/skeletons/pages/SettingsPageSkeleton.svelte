<script lang="ts">
	/**
	 * SettingsPageSkeleton - Full-page Skeleton für Settings Seite
	 *
	 * Zeigt Platzhalter für Settings Sections, Toggles und User Info
	 */

	import SkeletonBox from '../utils/SkeletonBox.svelte';

	interface Props {
		showAllSections?: boolean;
	}

	let { showAllSections = true }: Props = $props();
</script>

<div class="flex h-full flex-col">
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-3xl space-y-8 pb-12">
			<!-- Header -->
			<div>
				<SkeletonBox width="150px" height="36px" className="mb-2" />
			</div>

			<!-- User Info Card -->
			<div class="rounded-xl border border-theme bg-menu p-6">
				<div class="flex items-center gap-4 mb-6">
					<!-- Avatar -->
					<SkeletonBox width="64px" height="64px" borderRadius="50%" />
					<div class="flex-1">
						<SkeletonBox width="180px" height="20px" className="mb-2" />
						<SkeletonBox width="240px" height="16px" />
					</div>
				</div>
				<!-- Sign Out Button -->
				<SkeletonBox width="120px" height="40px" borderRadius="8px" />
			</div>

			<!-- Theme Section -->
			<div>
				<SkeletonBox width="80px" height="24px" className="mb-4" />
				<div class="rounded-xl border border-theme bg-menu p-6">
					<!-- Theme Mode Buttons -->
					<div class="mb-6">
						<SkeletonBox width="100px" height="14px" className="mb-3" />
						<div class="flex gap-2">
							{#each [1, 2, 3] as _}
								<SkeletonBox width="80px" height="40px" borderRadius="8px" />
							{/each}
						</div>
					</div>

					<!-- Theme Variant -->
					<div>
						<SkeletonBox width="120px" height="14px" className="mb-3" />
						<div class="grid grid-cols-2 gap-2 md:grid-cols-4">
							{#each [1, 2, 3, 4] as _}
								<SkeletonBox width="100%" height="48px" borderRadius="8px" />
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Settings Toggles -->
			<div>
				<SkeletonBox width="100px" height="24px" className="mb-4" />
				<div class="space-y-3">
					{#each [1, 2, 3, 4] as _, i}
						<div
							class="rounded-xl border border-theme bg-menu p-4"
							style="opacity: {Math.max(0.5, 1 - i * 0.1)};"
						>
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<SkeletonBox width="160px" height="16px" className="mb-2" />
									<SkeletonBox width="220px" height="12px" />
								</div>
								<SkeletonBox width="48px" height="28px" borderRadius="14px" />
							</div>
						</div>
					{/each}
				</div>
			</div>

			{#if showAllSections}
				<!-- Support Section -->
				<div>
					<SkeletonBox width="90px" height="24px" className="mb-4" />
					<div class="space-y-3">
						{#each [1, 2, 3] as _}
							<div class="rounded-xl border border-theme bg-menu p-4">
								<div class="flex items-center justify-between">
									<SkeletonBox width="140px" height="16px" />
									<SkeletonBox width="20px" height="20px" />
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- App Info Section -->
				<div>
					<SkeletonBox width="110px" height="24px" className="mb-4" />
					<div class="rounded-xl border border-theme bg-menu p-6">
						<div class="space-y-3">
							{#each [1, 2, 3] as _}
								<div class="flex justify-between">
									<SkeletonBox width="100px" height="14px" />
									<SkeletonBox width="120px" height="14px" />
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Danger Zone -->
				<div>
					<SkeletonBox width="120px" height="24px" className="mb-4" />
					<div class="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
						<SkeletonBox width="140px" height="40px" borderRadius="8px" />
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
