<script lang="ts">
	/**
	 * RedirectSkeleton - Simple centered skeleton for redirect pages
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div
	class="flex flex-col items-center justify-center min-h-[50vh] gap-4"
	role="status"
	aria-label="Weiterleitung..."
>
	<SkeletonBox width="48px" height="48px" borderRadius="50%" />
	<SkeletonBox width="100px" height="16px" borderRadius="4px" />
</div>
