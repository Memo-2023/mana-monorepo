<script lang="ts">
	import { onMount } from 'svelte';
	import { categoriesStore } from '$lib/stores';

	onMount(async () => {
		await categoriesStore.fetchCategories();
	});

	async function seedCategories() {
		await categoriesStore.seedCategories();
	}
</script>

<svelte:head>
	<title>Kategorien | Finance</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Kategorien</h1>
		<div class="flex gap-2">
			{#if categoriesStore.categories.length === 0}
				<button
					onclick={seedCategories}
					class="rounded-lg border border-border px-4 py-2 hover:bg-accent"
				>
					Standard-Kategorien laden
				</button>
			{/if}
			<a
				href="/categories/new"
				class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
			>
				+ Neue Kategorie
			</a>
		</div>
	</div>

	{#if categoriesStore.isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if categoriesStore.error}
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">{categoriesStore.error}</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Expense Categories -->
			<div class="rounded-lg border border-border bg-card p-6">
				<h2 class="mb-4 text-lg font-semibold text-red-500">Ausgaben</h2>
				{#if categoriesStore.expenseCategories.length === 0}
					<p class="text-muted-foreground">Keine Ausgaben-Kategorien vorhanden.</p>
				{:else}
					<div class="space-y-2">
						{#each categoriesStore.expenseCategories as category}
							<a
								href="/categories/{category.id}"
								class="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50"
							>
								<div
									class="h-10 w-10 rounded-full flex items-center justify-center"
									style="background-color: {category.color || '#ef4444'}"
								>
									<span class="text-white font-medium">{category.name.charAt(0)}</span>
								</div>
								<div class="flex-1">
									<p class="font-medium">{category.name}</p>
									{#if category.isSystem}
										<span class="text-xs text-muted-foreground">Standard</span>
									{/if}
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Income Categories -->
			<div class="rounded-lg border border-border bg-card p-6">
				<h2 class="mb-4 text-lg font-semibold text-green-500">Einnahmen</h2>
				{#if categoriesStore.incomeCategories.length === 0}
					<p class="text-muted-foreground">Keine Einnahmen-Kategorien vorhanden.</p>
				{:else}
					<div class="space-y-2">
						{#each categoriesStore.incomeCategories as category}
							<a
								href="/categories/{category.id}"
								class="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50"
							>
								<div
									class="h-10 w-10 rounded-full flex items-center justify-center"
									style="background-color: {category.color || '#22c55e'}"
								>
									<span class="text-white font-medium">{category.name.charAt(0)}</span>
								</div>
								<div class="flex-1">
									<p class="font-medium">{category.name}</p>
									{#if category.isSystem}
										<span class="text-xs text-muted-foreground">Standard</span>
									{/if}
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
