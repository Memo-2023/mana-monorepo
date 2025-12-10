<script lang="ts">
	/**
	 * AlarmsSkeleton - Skeleton for alarms grid
	 * Shows placeholder tiles for alarm times
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div role="status" aria-label="Wecker werden geladen...">
	<!-- Alarm Preset Grid (matches DEFAULT_ALARM_PRESETS layout) -->
	<div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
		{#each Array(12) as _, i}
			<div
				class="bg-card rounded-xl p-3 border border-border flex flex-col items-center justify-center"
				style="opacity: {Math.max(0.4, 1 - i * 0.05)}"
			>
				<!-- Time -->
				<SkeletonBox width="48px" height="24px" borderRadius="4px" />
				<!-- Label -->
				<div class="mt-1">
					<SkeletonBox width="40px" height="10px" borderRadius="4px" />
				</div>
			</div>
		{/each}
	</div>
</div>
