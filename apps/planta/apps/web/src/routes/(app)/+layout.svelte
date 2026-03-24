<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { PillNavigation, QuickInputBar } from '@manacore/shared-ui';
	import type { PillNavItem, QuickInputItem, CreatePreview } from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { plantsApi } from '$lib/api/plants';
	import {
		parsePlantInput,
		resolvePlantData,
		formatParsedPlantPreview,
	} from '$lib/utils/plant-parser';
	import { SessionExpiredBanner } from '@manacore/shared-auth-ui';

	let { children } = $props();

	// Auth gate - prevent children from mounting before auth is confirmed
	let appReady = $state(false);

	// Navigation items for Planta
	const navItems: PillNavItem[] = [
		{ href: '/dashboard', label: 'Meine Pflanzen', icon: 'document' },
		{ href: '/add', label: 'Hinzufügen', icon: 'plus' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
	];

	let isDark = $derived(theme.isDark);

	function handleToggleTheme() {
		theme.toggleMode();
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	// QuickInputBar handlers
	async function handleInputSearch(query: string): Promise<QuickInputItem[]> {
		const plants = await plantsApi.getAll();
		const q = query.toLowerCase();
		return plants
			.filter(
				(p) =>
					p.name?.toLowerCase().includes(q) ||
					p.commonName?.toLowerCase().includes(q) ||
					p.scientificName?.toLowerCase().includes(q)
			)
			.slice(0, 10)
			.map((plant) => ({
				id: plant.id,
				title: plant.name || plant.commonName || 'Unbenannt',
				subtitle: plant.scientificName || undefined,
			}));
	}

	function handleInputSelect(item: QuickInputItem) {
		goto(`/plant/${item.id}`);
	}

	// Quick-Create handlers
	function handleParseCreate(query: string): CreatePreview | null {
		if (!query.trim()) return null;
		const parsed = parsePlantInput(query);
		if (!parsed.name) return null;
		const preview = formatParsedPlantPreview(parsed);
		return {
			title: `"${parsed.name}" erstellen`,
			subtitle: preview || 'Neue Pflanze',
		};
	}

	async function handleCreate(query: string): Promise<void> {
		if (!query.trim()) return;
		const parsed = parsePlantInput(query);
		if (!parsed.name) return;
		const resolved = resolvePlantData(parsed);
		const plant = await plantsApi.create({
			name: resolved.name,
			acquiredAt: resolved.acquiredAt,
		});
		if (plant?.id) {
			goto(`/plant/${plant.id}`);
		}
	}

	onMount(async () => {
		// Initialize auth state from stored tokens
		await authStore.initialize();
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Auth confirmed - allow children to render
		appReady = true;
	});
</script>

{#if appReady}
	<div class="layout-container">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Planta"
			homeRoute="/dashboard"
			onToggleTheme={handleToggleTheme}
			{isDark}
			showLogout={true}
			onLogout={handleLogout}
			loginHref="/login"
			primaryColor="#10b981"
		/>

		<!-- Quick Input Bar -->
		<QuickInputBar
			onSearch={handleInputSearch}
			onSelect={handleInputSelect}
			onParseCreate={handleParseCreate}
			onCreate={handleCreate}
			placeholder="Neue Pflanze oder suchen..."
			emptyText="Keine Pflanzen gefunden"
			searchingText="Suche..."
			createText="Erstellen"
			deferSearch={true}
			locale="de"
			appIcon="search"
			bottomOffset="70px"
		/>

		<main class="main-content pt-24">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>
	</div>
	<SessionExpiredBanner locale="de" loginHref="/login" />
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div
			class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
		></div>
	</div>
{/if}

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
	}

	.content-wrapper {
		max-width: 80rem;
		margin-left: auto;
		margin-right: auto;
		padding: 2rem 1rem;
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
		}
	}
</style>
