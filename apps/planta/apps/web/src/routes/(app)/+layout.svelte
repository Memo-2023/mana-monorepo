<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PillNavigation, QuickInputBar, TagStrip } from '@manacore/shared-ui';
	import { SyncIndicator } from '@manacore/shared-ui';
	import type { PillNavItem, QuickInputItem, CreatePreview } from '@manacore/shared-ui';
	import { SyncIndicator } from '@manacore/shared-ui';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { plantMutations } from '$lib/data/mutations';
	import {
		useAllPlants,
		useAllPlantPhotos,
		useAllWateringSchedules,
		useAllWateringLogs,
	} from '$lib/data/queries';
	import {
		parsePlantInput,
		resolvePlantData,
		formatParsedPlantPreview,
	} from '$lib/utils/plant-parser';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { setContext } from 'svelte';
	import { plantaStore } from '$lib/data/local-store';

	let { children } = $props();

	// Live queries for local-first data (auto-update on Dexie changes)
	const allPlants = useAllPlants();
	const allPlantPhotos = useAllPlantPhotos();
	const allWateringSchedules = useAllWateringSchedules();
	const allWateringLogs = useAllWateringLogs();
	const allTags = useAllSharedTags();

	// Set context for child components
	setContext('plants', allPlants);
	setContext('plantPhotos', allPlantPhotos);
	setContext('wateringSchedules', allWateringSchedules);
	setContext('wateringLogs', allWateringLogs);
	setContext('tags', allTags);

	let showGuestWelcome = $state(false);

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// Navigation items for Planta
	const navItems: PillNavItem[] = [
		{ href: '/dashboard', label: 'Meine Pflanzen', icon: 'document' },
		{ href: '/add', label: 'Hinzufuegen', icon: 'plus' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	];

	let isDark = $derived(theme.isDark);

	function handleToggleTheme() {
		theme.toggleMode();
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	// QuickInputBar handlers — use live query data instead of API
	async function handleInputSearch(query: string): Promise<QuickInputItem[]> {
		const plants = allPlants.value;
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
		goto(`/plants/${item.id}`);
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
		const plant = await plantMutations.create({
			name: resolved.name,
			acquiredAt: resolved.acquiredAt,
		});
		if (plant?.id) {
			goto(`/plants/${plant.id}`);
		}
	}

	async function handleAuthReady() {
		await Promise.all([plantaStore.initialize(), tagLocalStore.initialize()]);
		if (authStore.isAuthenticated) {
			const getToken = () => authStore.getValidToken();
			plantaStore.startSync(getToken);
			tagMutations.startSync(getToken);
		}
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('planta')) {
			showGuestWelcome = true;
		}
	}
</script>

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
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
			settingsHref="/settings"
			themesHref="/themes"
			helpHref="/help"
			profileHref="/profile"
		/>

		<!-- TagStrip (above PillNav, toggled via Tags pill) -->
		{#if isTagStripVisible}
			<TagStrip
				tags={allTags.value.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#3b82f6',
				}))}
				selectedIds={[]}
				onToggle={() => {}}
				onClear={() => {}}
				managementHref="/tags"
			/>
		{/if}

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
	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale="de" loginHref="/login" />
	{/if}

	<GuestWelcomeModal
		appId="planta"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale="de"
	/>
	<SyncIndicator />
</AuthGate>

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
