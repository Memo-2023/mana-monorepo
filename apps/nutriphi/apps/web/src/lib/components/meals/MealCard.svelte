<script lang="ts">
	import type { Meal } from '$lib/types/meal';

	interface Props {
		meal: Meal;
		onclick?: () => void;
	}

	let { meal, onclick }: Props = $props();

	function getMealTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			breakfast: 'Frühstück',
			lunch: 'Mittagessen',
			dinner: 'Abendessen',
			snack: 'Snack',
		};
		return labels[type] || type;
	}

	const healthColor = $derived(() => {
		if (!meal.health_score) return 'text-gray-400';
		if (meal.health_score >= 8) return 'text-green-500';
		if (meal.health_score >= 6) return 'text-yellow-500';
		if (meal.health_score >= 4) return 'text-orange-500';
		return 'text-red-500';
	});

	function formatDate(timestamp: string): string {
		return new Date(timestamp).toLocaleDateString('de-DE', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
		});
	}

	function formatTime(timestamp: string): string {
		return new Date(timestamp).toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

<button
	{onclick}
	class="group relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 transition-transform hover:scale-[1.02] dark:bg-gray-700"
>
	{#if meal.photo_url}
		<img
			src={meal.photo_url}
			alt={getMealTypeLabel(meal.meal_type)}
			class="h-full w-full object-cover transition-transform group-hover:scale-105"
		/>
	{:else}
		<div class="flex h-full items-center justify-center text-4xl">🍽️</div>
	{/if}

	<!-- Overlay -->
	<div
		class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4"
	>
		<div class="flex items-end justify-between">
			<div>
				<p class="font-semibold text-white">{getMealTypeLabel(meal.meal_type)}</p>
				<p class="text-sm text-gray-300">
					{formatDate(meal.timestamp)} • {formatTime(meal.timestamp)}
				</p>
			</div>
			<div class="text-right">
				{#if meal.total_calories}
					<p class="font-bold text-white">{Math.round(meal.total_calories)}</p>
					<p class="text-xs text-gray-300">kcal</p>
				{/if}
			</div>
		</div>

		{#if meal.health_score}
			<div class="mt-2 flex items-center gap-1">
				<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
					<div
						class="h-full rounded-full {meal.health_score >= 7
							? 'bg-green-500'
							: meal.health_score >= 5
								? 'bg-yellow-500'
								: 'bg-red-500'}"
						style="width: {meal.health_score * 10}%"
					></div>
				</div>
				<span class="text-xs font-medium text-white">{meal.health_score}/10</span>
			</div>
		{/if}
	</div>

	<!-- Analysis Status Badge -->
	{#if meal.analysis_status === 'pending'}
		<div
			class="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white"
		>
			<div class="h-2 w-2 animate-pulse rounded-full bg-white"></div>
			Analysiert...
		</div>
	{:else if meal.analysis_status === 'failed'}
		<div
			class="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white"
		>
			Fehler
		</div>
	{/if}
</button>
