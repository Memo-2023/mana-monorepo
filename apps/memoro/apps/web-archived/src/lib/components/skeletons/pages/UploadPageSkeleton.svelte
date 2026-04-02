<script lang="ts">
	/**
	 * UploadPageSkeleton - Skeleton für Upload Page
	 *
	 * Matched exakt die Struktur der Upload-Seite:
	 * - Header (wird von Seite gerendert)
	 * - File Upload Card
	 * - Options Form (Title, Blueprint, Space, Languages, Diarization)
	 * - Upload Button
	 */

	import SkeletonBox from '../utils/SkeletonBox.svelte';

	interface Props {
		showOptionsForm?: boolean;
	}

	let { showOptionsForm = true }: Props = $props();
</script>

<div class="space-y-4">
	<!-- File Upload Card -->
	<div class="mb-4">
		<div class="rounded-xl border border-theme bg-menu p-4">
			<!-- Title -->
			<SkeletonBox width="120px" height="20px" borderRadius="4px" className="mb-3" />

			<!-- Drag & Drop Area -->
			<div class="rounded-lg border-2 border-dashed border-theme bg-content p-6">
				<div class="flex flex-col items-center gap-3">
					<!-- Upload Icon -->
					<SkeletonBox width="40px" height="40px" borderRadius="8px" />
					<!-- Text -->
					<SkeletonBox width="180px" height="14px" borderRadius="3px" />
					<!-- Button -->
					<SkeletonBox width="110px" height="32px" borderRadius="8px" className="mt-1" />
					<!-- Format Text -->
					<SkeletonBox width="140px" height="12px" borderRadius="3px" className="mt-1" />
				</div>
			</div>
		</div>
	</div>

	{#if showOptionsForm}
		<!-- Upload Options -->
		<div class="mb-4 rounded-xl border border-theme bg-menu p-4">
			<!-- Title -->
			<SkeletonBox width="80px" height="20px" borderRadius="4px" className="mb-4" />

			<div class="space-y-4">
				<!-- Title Input -->
				<div>
					<SkeletonBox width="80px" height="14px" borderRadius="3px" className="mb-1.5" />
					<SkeletonBox width="100%" height="34px" borderRadius="8px" />
				</div>

				<!-- Blueprint Selector -->
				<div>
					<SkeletonBox width="100px" height="14px" borderRadius="3px" className="mb-1.5" />
					<SkeletonBox width="100%" height="34px" borderRadius="8px" />
				</div>

				<!-- Date and Time -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<SkeletonBox width="70px" height="14px" borderRadius="3px" className="mb-1.5" />
						<SkeletonBox width="100%" height="34px" borderRadius="8px" />
					</div>
					<div>
						<SkeletonBox width="80px" height="14px" borderRadius="3px" className="mb-1.5" />
						<SkeletonBox width="100%" height="34px" borderRadius="8px" />
					</div>
				</div>

				<!-- Languages Input -->
				<div>
					<SkeletonBox width="60px" height="14px" borderRadius="3px" className="mb-1.5" />
					<div class="flex gap-2">
						<SkeletonBox width="80px" height="32px" borderRadius="8px" />
						<SkeletonBox width="80px" height="32px" borderRadius="8px" />
						<SkeletonBox width="80px" height="32px" borderRadius="8px" />
					</div>
				</div>

				<!-- Diarization Toggle -->
				<div class="flex items-center justify-between">
					<SkeletonBox width="140px" height="14px" borderRadius="3px" />
					<SkeletonBox width="48px" height="28px" borderRadius="14px" />
				</div>
			</div>
		</div>

		<!-- Upload Button -->
		<div class="flex justify-end gap-3">
			<SkeletonBox width="100px" height="36px" borderRadius="8px" />
			<SkeletonBox width="200px" height="36px" borderRadius="8px" />
		</div>
	{/if}
</div>
