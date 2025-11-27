<script lang="ts">
	import type { DateRange, StatsData } from '$lib/types/stats';

	let dateRange = $state<DateRange>('week');
	let isLoading = $state(false);

	// Placeholder stats data
	let stats = $state<StatsData | null>(null);

	const dateRanges: { value: DateRange; label: string }[] = [
		{ value: 'week', label: 'Woche' },
		{ value: 'month', label: 'Monat' },
		{ value: 'year', label: 'Jahr' },
	];
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Statistiken</h1>
			<p class="text-gray-600 dark:text-gray-400">Überblick über deine Ernährung</p>
		</div>

		<!-- Date Range Selector -->
		<div class="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
			{#each dateRanges as range}
				<button
					onclick={() => (dateRange = range.value)}
					class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {dateRange ===
					range.value
						? 'bg-white text-green-600 shadow dark:bg-gray-600 dark:text-green-400'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
				>
					{range.label}
				</button>
			{/each}
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent"
			></div>
		</div>
	{:else}
		<!-- Summary Cards -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
				<p class="text-sm text-gray-600 dark:text-gray-400">Durchschn. Kalorien</p>
				<p class="text-3xl font-bold text-gray-900 dark:text-white">— kcal</p>
				<p class="text-sm text-green-600">Pro Tag</p>
			</div>
			<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
				<p class="text-sm text-gray-600 dark:text-gray-400">Durchschn. Protein</p>
				<p class="text-3xl font-bold text-gray-900 dark:text-white">— g</p>
				<p class="text-sm text-blue-600">Pro Tag</p>
			</div>
			<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
				<p class="text-sm text-gray-600 dark:text-gray-400">Mahlzeiten</p>
				<p class="text-3xl font-bold text-gray-900 dark:text-white">0</p>
				<p class="text-sm text-gray-500">Insgesamt</p>
			</div>
			<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
				<p class="text-sm text-gray-600 dark:text-gray-400">Health Score</p>
				<p class="text-3xl font-bold text-gray-900 dark:text-white">—/10</p>
				<p class="text-sm text-yellow-600">Durchschnitt</p>
			</div>
		</div>

		<!-- Charts -->
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Calorie Chart -->
			<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
				<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Kalorien-Verlauf</h2>
				<div class="flex h-64 items-center justify-center text-gray-400">
					<div class="text-center">
						<div class="mb-2 text-4xl">📊</div>
						<p>Noch keine Daten</p>
						<p class="text-sm">Erfasse deine erste Mahlzeit</p>
					</div>
				</div>
			</div>

			<!-- Macro Distribution -->
			<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
				<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Makro-Verteilung</h2>
				<div class="flex h-64 items-center justify-center text-gray-400">
					<div class="text-center">
						<div class="mb-2 text-4xl">🥧</div>
						<p>Noch keine Daten</p>
						<p class="text-sm">Erfasse deine erste Mahlzeit</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Weekly Overview -->
		<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Wochen-Übersicht</h2>
			<div class="flex h-48 items-center justify-center text-gray-400">
				<div class="text-center">
					<div class="mb-2 text-4xl">📅</div>
					<p>Noch keine Daten verfügbar</p>
				</div>
			</div>
		</div>
	{/if}
</div>
