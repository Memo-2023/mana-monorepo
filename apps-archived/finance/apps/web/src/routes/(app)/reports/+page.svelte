<script lang="ts">
	import { onMount } from 'svelte';
	import { reportsApi } from '$lib/api';
	import { formatCurrency, getMonthDateRange, getCurrentMonthYear } from '@finance/shared';

	let trends = $state<
		{ year: number; month: number; income: number; expense: number; net: number }[]
	>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	const months = [
		'Jan',
		'Feb',
		'Mär',
		'Apr',
		'Mai',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Okt',
		'Nov',
		'Dez',
	];

	onMount(async () => {
		try {
			const result = await reportsApi.getTrends(6);
			trends = result.data;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load reports';
		} finally {
			isLoading = false;
		}
	});

	const maxAmount = $derived(Math.max(...trends.flatMap((t) => [t.income, t.expense]), 1));
</script>

<svelte:head>
	<title>Berichte | Finance</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Berichte</h1>

	<!-- Quick Links -->
	<div class="grid gap-4 md:grid-cols-3">
		<a
			href="/reports/monthly"
			class="rounded-lg border border-border bg-card p-6 hover:bg-accent/50"
		>
			<h3 class="font-semibold">Monatsübersicht</h3>
			<p class="mt-1 text-sm text-muted-foreground">Detaillierte Aufschlüsselung nach Kategorie</p>
		</a>
		<a
			href="/reports/trends"
			class="rounded-lg border border-border bg-card p-6 hover:bg-accent/50"
		>
			<h3 class="font-semibold">Trends</h3>
			<p class="mt-1 text-sm text-muted-foreground">Ausgaben und Einnahmen über Zeit</p>
		</a>
		<a href="/settings" class="rounded-lg border border-border bg-card p-6 hover:bg-accent/50">
			<h3 class="font-semibold">Export</h3>
			<p class="mt-1 text-sm text-muted-foreground">Daten als CSV exportieren</p>
		</a>
	</div>

	<!-- Trends Preview -->
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
	{:else}
		<div class="rounded-lg border border-border bg-card p-6">
			<h2 class="mb-6 text-lg font-semibold">Letzte 6 Monate</h2>

			<!-- Simple Bar Chart -->
			<div class="space-y-4">
				{#each trends as month}
					<div class="space-y-1">
						<div class="flex items-center justify-between text-sm">
							<span class="font-medium">{months[month.month - 1]} {month.year}</span>
							<span class="text-muted-foreground"
								>Netto: <span class={month.net >= 0 ? 'text-green-500' : 'text-red-500'}
									>{formatCurrency(month.net)}</span
								></span
							>
						</div>
						<div class="flex gap-2">
							<div class="flex-1">
								<div class="h-4 overflow-hidden rounded bg-green-100 dark:bg-green-900/30">
									<div
										class="h-full bg-green-500"
										style="width: {(month.income / maxAmount) * 100}%"
									></div>
								</div>
								<span class="text-xs text-green-600">{formatCurrency(month.income)}</span>
							</div>
							<div class="flex-1">
								<div class="h-4 overflow-hidden rounded bg-red-100 dark:bg-red-900/30">
									<div
										class="h-full bg-red-500"
										style="width: {(month.expense / maxAmount) * 100}%"
									></div>
								</div>
								<span class="text-xs text-red-600">{formatCurrency(month.expense)}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
				<span class="flex items-center gap-1"
					><span class="h-3 w-3 rounded bg-green-500"></span> Einnahmen</span
				>
				<span class="flex items-center gap-1"
					><span class="h-3 w-3 rounded bg-red-500"></span> Ausgaben</span
				>
			</div>
		</div>
	{/if}
</div>
