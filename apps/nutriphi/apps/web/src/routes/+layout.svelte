<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { isLoading as i18nLoading, _ as t } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { QuickInputBar } from '@manacore/shared-ui';
	import type { QuickInputItem, CreatePreview } from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { mealsStore } from '$lib/stores/meals.svelte';
	import { parseMealInput, formatParsedMealPreview } from '$lib/utils/meal-parser';
	import { SessionExpiredBanner } from '@manacore/shared-auth-ui';
	import { onMount } from 'svelte';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

	// QuickInputBar handlers - search recent meals
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		const q = query.toLowerCase();
		return mealsStore.meals
			.filter((m) => m.description?.toLowerCase().includes(q))
			.slice(0, 10)
			.map((meal) => ({
				id: meal.id,
				title: meal.description || 'Mahlzeit',
				subtitle: meal.mealType,
			}));
	}

	function handleSelect(item: QuickInputItem) {
		// No detail page for meals - just scroll to it
	}

	function handleParseCreate(query: string): CreatePreview | null {
		if (!query.trim()) return null;
		const parsed = parseMealInput(query);
		if (!parsed.description) return null;
		return {
			title: `"${parsed.description}" analysieren`,
			subtitle: formatParsedMealPreview(parsed),
		};
	}

	async function handleCreate(query: string): Promise<void> {
		if (!query.trim()) return;
		const parsed = parseMealInput(query);
		if (!parsed.description) return;
		// Navigate to add page with pre-filled description and meal type
		const params = new URLSearchParams({
			type: 'text',
			description: parsed.description,
			mealType: parsed.mealType,
		});
		goto(`/add?${params.toString()}`);
	}

	onMount(() => {
		authStore.initialize().then(() => {
			loading = false;
		});
	});
</script>

<svelte:head>
	{#if appReady}
		<title>{$t('app.name')} - {$t('app.tagline')}</title>
	{:else}
		<title>NutriPhi</title>
	{/if}
</svelte:head>

{#if !appReady}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
		></div>
	</div>
{:else}
	{@render children()}

	{#if authStore.isAuthenticated}
		<QuickInputBar
			onSearch={handleSearch}
			onSelect={handleSelect}
			onParseCreate={handleParseCreate}
			onCreate={handleCreate}
			placeholder="Mahlzeit eingeben..."
			emptyText="Keine Mahlzeiten gefunden"
			searchingText="Suche..."
			createText="Analysieren"
			deferSearch={true}
			locale="de"
			appIcon="search"
			bottomOffset="70px"
		/>
	{/if}
	<SessionExpiredBanner locale="de" loginHref="/login" />
{/if}
