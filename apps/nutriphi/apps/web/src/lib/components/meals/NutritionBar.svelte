<script lang="ts">
	import type { Meal } from '$lib/types/meal';

	interface Props {
		meal: Meal;
		showDetailed?: boolean;
	}

	let { meal, showDetailed = false }: Props = $props();

	const healthColor = $derived(() => {
		if (!meal.health_score) return 'bg-gray-400';
		if (meal.health_score >= 8) return 'bg-green-500';
		if (meal.health_score >= 6) return 'bg-yellow-500';
		if (meal.health_score >= 4) return 'bg-orange-500';
		return 'bg-red-500';
	});

	const healthLabel = $derived(() => {
		if (!meal.health_category) return '';
		const labels: Record<string, string> = {
			very_healthy: 'Sehr gesund',
			healthy: 'Gesund',
			moderate: 'Moderat',
			unhealthy: 'Ungesund',
		};
		return labels[meal.health_category] || '';
	});
</script>

<div class="space-y-4">
	<!-- Calories Header -->
	<div class="flex items-center justify-between">
		<div>
			<p class="text-3xl font-bold text-gray-900 dark:text-white">
				{meal.total_calories ? Math.round(meal.total_calories) : '—'} kcal
			</p>
			{#if healthLabel()}
				<p class="text-sm text-gray-600 dark:text-gray-400">{healthLabel()}</p>
			{/if}
		</div>
		{#if meal.health_score}
			<div class="flex items-center gap-2">
				<div class="h-4 w-4 rounded-full {healthColor()}"></div>
				<span class="text-xl font-semibold text-gray-900 dark:text-white">
					{meal.health_score}/10
				</span>
			</div>
		{/if}
	</div>

	<!-- Macro Pills -->
	<div class="grid grid-cols-3 gap-3">
		<div class="rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-900/20">
			<p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
				{meal.total_protein ? Math.round(meal.total_protein) : '—'}g
			</p>
			<p class="text-xs text-gray-600 dark:text-gray-400">Protein</p>
		</div>
		<div class="rounded-xl bg-green-50 p-3 text-center dark:bg-green-900/20">
			<p class="text-2xl font-bold text-green-600 dark:text-green-400">
				{meal.total_carbs ? Math.round(meal.total_carbs) : '—'}g
			</p>
			<p class="text-xs text-gray-600 dark:text-gray-400">Carbs</p>
		</div>
		<div class="rounded-xl bg-orange-50 p-3 text-center dark:bg-orange-900/20">
			<p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
				{meal.total_fat ? Math.round(meal.total_fat) : '—'}g
			</p>
			<p class="text-xs text-gray-600 dark:text-gray-400">Fett</p>
		</div>
	</div>

	<!-- Detailed Progress Bars -->
	{#if showDetailed}
		<div class="space-y-3 pt-2">
			<!-- Protein -->
			<div>
				<div class="mb-1 flex justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Protein</span>
					<span class="font-medium text-blue-600 dark:text-blue-400">
						{meal.total_protein ? Math.round(meal.total_protein) : 0}g
					</span>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full bg-blue-500 transition-all"
						style="width: {Math.min(((meal.total_protein || 0) / 50) * 100, 100)}%"
					></div>
				</div>
			</div>

			<!-- Carbs -->
			<div>
				<div class="mb-1 flex justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Kohlenhydrate</span>
					<span class="font-medium text-green-600 dark:text-green-400">
						{meal.total_carbs ? Math.round(meal.total_carbs) : 0}g
					</span>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full bg-green-500 transition-all"
						style="width: {Math.min(((meal.total_carbs || 0) / 100) * 100, 100)}%"
					></div>
				</div>
			</div>

			<!-- Fat -->
			<div>
				<div class="mb-1 flex justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Fett</span>
					<span class="font-medium text-orange-600 dark:text-orange-400">
						{meal.total_fat ? Math.round(meal.total_fat) : 0}g
					</span>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full bg-orange-500 transition-all"
						style="width: {Math.min(((meal.total_fat || 0) / 65) * 100, 100)}%"
					></div>
				</div>
			</div>

			<!-- Fiber -->
			{#if meal.total_fiber !== undefined}
				<div>
					<div class="mb-1 flex justify-between text-sm">
						<span class="text-gray-600 dark:text-gray-400">Ballaststoffe</span>
						<span class="font-medium text-purple-600 dark:text-purple-400">
							{Math.round(meal.total_fiber)}g
						</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
						<div
							class="h-full bg-purple-500 transition-all"
							style="width: {Math.min((meal.total_fiber / 25) * 100, 100)}%"
						></div>
					</div>
				</div>
			{/if}

			<!-- Sugar -->
			{#if meal.total_sugar !== undefined}
				<div>
					<div class="mb-1 flex justify-between text-sm">
						<span class="text-gray-600 dark:text-gray-400">Zucker</span>
						<span class="font-medium text-pink-600 dark:text-pink-400">
							{Math.round(meal.total_sugar)}g
						</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
						<div
							class="h-full bg-pink-500 transition-all"
							style="width: {Math.min((meal.total_sugar / 50) * 100, 100)}%"
						></div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
