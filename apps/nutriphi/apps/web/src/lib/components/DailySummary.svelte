<script lang="ts">
	import { mealsStore } from '$lib/stores/meals.svelte';
	import { onMount } from 'svelte';
	import ProgressRing from './ProgressRing.svelte';

	onMount(() => {
		mealsStore.fetchDailySummary();
	});

	let progress = $derived(mealsStore.dailySummary?.progress);
	let caloriePercent = $derived(progress?.calories?.percentage ?? 0);
</script>

<div class="bg-[var(--color-background-card)] rounded-2xl p-4 border border-[var(--color-border)]">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Heute</h2>
		<span class="text-sm text-[var(--color-text-secondary)]">
			{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
		</span>
	</div>

	<!-- Calories Ring -->
	<div class="flex items-center gap-6">
		<ProgressRing
			percentage={caloriePercent}
			size={100}
			strokeWidth={8}
			color="var(--color-calories)"
		>
			<div class="text-center">
				<div class="text-2xl font-bold text-[var(--color-text-primary)]">
					{progress?.calories?.current ?? 0}
				</div>
				<div class="text-xs text-[var(--color-text-secondary)]">
					/ {progress?.calories?.target ?? 2000}
				</div>
			</div>
		</ProgressRing>

		<!-- Macros -->
		<div class="flex-1 grid grid-cols-3 gap-2">
			<div class="text-center">
				<div class="text-sm font-medium text-[var(--color-protein)]">
					{progress?.protein?.current ?? 0}g
				</div>
				<div class="text-xs text-[var(--color-text-muted)]">Protein</div>
				<div class="mt-1 h-1 bg-[var(--color-background-elevated)] rounded-full overflow-hidden">
					<div
						class="h-full bg-[var(--color-protein)] transition-all"
						style="width: {progress?.protein?.percentage ?? 0}%"
					></div>
				</div>
			</div>

			<div class="text-center">
				<div class="text-sm font-medium text-[var(--color-carbs)]">
					{progress?.carbs?.current ?? 0}g
				</div>
				<div class="text-xs text-[var(--color-text-muted)]">Carbs</div>
				<div class="mt-1 h-1 bg-[var(--color-background-elevated)] rounded-full overflow-hidden">
					<div
						class="h-full bg-[var(--color-carbs)] transition-all"
						style="width: {progress?.carbs?.percentage ?? 0}%"
					></div>
				</div>
			</div>

			<div class="text-center">
				<div class="text-sm font-medium text-[var(--color-fat)]">
					{progress?.fat?.current ?? 0}g
				</div>
				<div class="text-xs text-[var(--color-text-muted)]">Fett</div>
				<div class="mt-1 h-1 bg-[var(--color-background-elevated)] rounded-full overflow-hidden">
					<div
						class="h-full bg-[var(--color-fat)] transition-all"
						style="width: {progress?.fat?.percentage ?? 0}%"
					></div>
				</div>
			</div>
		</div>
	</div>
</div>
