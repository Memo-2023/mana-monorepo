<script lang="ts">
	import type { NutritionGoal, DailyProgress } from '$lib/types/goal';

	let goals = $state<NutritionGoal | null>(null);
	let todayProgress = $state<DailyProgress | null>(null);
	let isEditing = $state(false);
	let isLoading = $state(false);

	// Form state
	let caloriesTarget = $state(2000);
	let proteinTarget = $state(50);
	let carbsTarget = $state(250);
	let fatTarget = $state(65);

	function getProgressPercent(current: number, target: number): number {
		if (!target) return 0;
		return Math.min(Math.round((current / target) * 100), 100);
	}

	function getProgressColor(percent: number): string {
		if (percent >= 100) return 'bg-green-500';
		if (percent >= 75) return 'bg-yellow-500';
		return 'bg-blue-500';
	}

	async function saveGoals() {
		isLoading = true;
		// TODO: Save goals to API
		await new Promise((resolve) => setTimeout(resolve, 500));
		isEditing = false;
		isLoading = false;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Ernährungsziele</h1>
			<p class="text-gray-600 dark:text-gray-400">Setze und verfolge deine täglichen Ziele</p>
		</div>
		{#if !isEditing}
			<button
				onclick={() => (isEditing = true)}
				class="rounded-xl bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-600"
			>
				Ziele bearbeiten
			</button>
		{/if}
	</div>

	<!-- Today's Progress -->
	<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Heutiger Fortschritt</h2>

		<div class="space-y-4">
			<!-- Calories -->
			<div>
				<div class="mb-1 flex justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Kalorien</span>
					<span class="font-medium text-gray-900 dark:text-white">
						{todayProgress?.calories ?? 0} / {goals?.calories_target ?? caloriesTarget} kcal
					</span>
				</div>
				<div class="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full {getProgressColor(
							getProgressPercent(
								todayProgress?.calories ?? 0,
								goals?.calories_target ?? caloriesTarget
							)
						)} transition-all"
						style="width: {getProgressPercent(
							todayProgress?.calories ?? 0,
							goals?.calories_target ?? caloriesTarget
						)}%"
					></div>
				</div>
			</div>

			<!-- Protein -->
			<div>
				<div class="mb-1 flex justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Protein</span>
					<span class="font-medium text-gray-900 dark:text-white">
						{todayProgress?.protein ?? 0} / {goals?.protein_target ?? proteinTarget} g
					</span>
				</div>
				<div class="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full bg-blue-500 transition-all"
						style="width: {getProgressPercent(
							todayProgress?.protein ?? 0,
							goals?.protein_target ?? proteinTarget
						)}%"
					></div>
				</div>
			</div>

			<!-- Carbs -->
			<div>
				<div class="mb-1 flex justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Kohlenhydrate</span>
					<span class="font-medium text-gray-900 dark:text-white">
						{todayProgress?.carbs ?? 0} / {goals?.carbs_target ?? carbsTarget} g
					</span>
				</div>
				<div class="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full bg-green-500 transition-all"
						style="width: {getProgressPercent(
							todayProgress?.carbs ?? 0,
							goals?.carbs_target ?? carbsTarget
						)}%"
					></div>
				</div>
			</div>

			<!-- Fat -->
			<div>
				<div class="mb-1 flex justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Fett</span>
					<span class="font-medium text-gray-900 dark:text-white">
						{todayProgress?.fat ?? 0} / {goals?.fat_target ?? fatTarget} g
					</span>
				</div>
				<div class="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full bg-orange-500 transition-all"
						style="width: {getProgressPercent(
							todayProgress?.fat ?? 0,
							goals?.fat_target ?? fatTarget
						)}%"
					></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Edit Goals Form -->
	{#if isEditing}
		<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Ziele festlegen</h2>

			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Kalorien (kcal/Tag)
					</label>
					<input
						type="number"
						bind:value={caloriesTarget}
						min="500"
						max="10000"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Protein (g/Tag)
					</label>
					<input
						type="number"
						bind:value={proteinTarget}
						min="10"
						max="500"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Kohlenhydrate (g/Tag)
					</label>
					<input
						type="number"
						bind:value={carbsTarget}
						min="10"
						max="1000"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Fett (g/Tag)
					</label>
					<input
						type="number"
						bind:value={fatTarget}
						min="10"
						max="500"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>

			<div class="mt-6 flex gap-4">
				<button
					onclick={() => (isEditing = false)}
					class="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Abbrechen
				</button>
				<button
					onclick={saveGoals}
					disabled={isLoading}
					class="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isLoading ? 'Wird gespeichert...' : 'Speichern'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Goal Tips -->
	<div class="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
		<h2 class="mb-2 text-lg font-semibold">Tipp</h2>
		<p>
			Die empfohlene tägliche Kalorienzufuhr liegt bei etwa 2000 kcal für Frauen und 2500 kcal für
			Männer. Passe deine Ziele an deine persönlichen Bedürfnisse und Aktivitätslevel an.
		</p>
	</div>
</div>
