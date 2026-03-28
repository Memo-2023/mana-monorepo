<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, setContext } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, CommandBar, TagStrip } from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		CommandBarItem,
		QuickAction,
	} from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { spacesStore } from '$lib/stores/spaces.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import { useAllSpaces, useAllDocuments } from '$lib/data/queries';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { contextOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { contextStore } from '$lib/data/local-store';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';

	const appItems = getPillAppItems('context');

	const allTags = useAllSharedTags();
	setContext('tags', allTags);

	// Live queries: all spaces and documents (reactive, auto-updates on IndexedDB changes)
	const allSpaces = useAllSpaces();
	const allDocuments = useAllDocuments();

	let { children } = $props();

	let commandBarOpen = $state(false);

	const commandBarQuickActions: QuickAction[] = [
		{
			id: 'new-space',
			label: 'Neuen Space erstellen',
			icon: 'folder',
			href: '/spaces?new=true',
			shortcut: 'S',
		},
		{
			id: 'new-document',
			label: 'Neues Dokument',
			icon: 'file-text',
			href: '/documents?new=true',
			shortcut: 'D',
		},
		{ id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
	];

	async function handleCommandBarSearch(query: string): Promise<CommandBarItem[]> {
		if (!query.trim()) return [];
		const q = query.toLowerCase();
		const results: CommandBarItem[] = [];

		// Search spaces
		(allSpaces.value ?? [])
			.filter((s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
			.slice(0, 5)
			.forEach((s) => {
				results.push({
					id: `space-${s.id}`,
					title: s.name,
					subtitle: s.description || 'Space',
				});
			});

		// Search documents
		(allDocuments.value ?? [])
			.filter((d) => d.title.toLowerCase().includes(q) || d.content?.toLowerCase().includes(q))
			.slice(0, 5)
			.forEach((d) => {
				const typeLabel = d.type === 'text' ? 'Text' : d.type === 'context' ? 'Kontext' : 'Prompt';
				results.push({
					id: `doc-${d.id}`,
					title: d.title,
					subtitle: typeLabel,
				});
			});

		return results.slice(0, 10);
	}

	function handleCommandBarSelect(item: CommandBarItem) {
		if (item.id.startsWith('space-')) {
			goto(`/spaces/${item.id.replace('space-', '')}`);
		} else if (item.id.startsWith('doc-')) {
			goto(`/documents/${item.id.replace('doc-', '')}`);
		}
	}

	let isCollapsed = $state(false);

	let isDark = $derived(theme.isDark);

	let pinnedThemes = $derived<ThemeVariant[]>(
		(userSettings.theme?.pinnedThemes || []).filter((t): t is ThemeVariant =>
			EXTENDED_THEME_VARIANTS.includes(t as ThemeVariant)
		)
	);

	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS, ...pinnedThemes]);

	let themeVariantItems = $derived<PillDropdownItem[]>([
		...visibleThemes.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant]?.label || variant,
			icon: THEME_DEFINITIONS[variant]?.icon || '🎨',
			onClick: () => theme.setVariant(variant),
			active: (theme.variant || 'lume') === variant,
		})),
		{
			id: 'all-themes',
			label: 'Alle Themes',
			icon: 'palette',
			onClick: () => goto('/themes'),
			active: false,
		},
	]);

	let currentThemeVariantLabel = $derived(
		THEME_DEFINITIONS[theme.variant]?.label || THEME_DEFINITIONS.lume?.label || 'Lume'
	);

	let currentLocale = $derived($locale || 'de');
	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as any);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	let userEmail = $derived(authStore.user?.email || 'Menü');

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	const baseNavItems: PillNavItem[] = [
		{ href: '/', label: 'Übersicht', icon: 'home' },
		{ href: '/spaces', label: 'Spaces', icon: 'folder' },
		{ href: '/documents', label: 'Dokumente', icon: 'file-text' },
		{ href: '/tokens', label: 'Tokens', icon: 'sparkle' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	];

	const navItems = $derived(
		filterHiddenNavItems('context', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	const navRoutes = baseNavItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			commandBarOpen = true;
			return;
		}

		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num >= 1 && num <= navRoutes.length) {
				event.preventDefault();
				const route = navRoutes[num - 1];
				if (route) {
					goto(route);
				}
			}
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('context-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	let showGuestWelcome = $state(false);

	async function handleAuthReady() {
		await Promise.all([contextStore.initialize(), tagLocalStore.initialize()]);
		if (authStore.isAuthenticated) {
			const getToken = () => authStore.getValidToken();
			contextStore.startSync(getToken);
			tagMutations.startSync(getToken);
		}
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('context')) {
			showGuestWelcome = true;
		}

		const savedCollapsed = localStorage.getItem('context-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		if (authStore.isAuthenticated) {
			await userSettings.load();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="layout-container">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Context"
			homeRoute="/"
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			showThemeVariants={true}
			{themeVariantItems}
			{currentThemeVariantLabel}
			themeMode={theme.mode}
			onThemeModeChange={handleThemeModeChange}
			showLanguageSwitcher={true}
			{languageItems}
			{currentLanguageLabel}
			showLogout={true}
			onLogout={handleLogout}
			loginHref="/login"
			primaryColor="#0ea5e9"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/mana"
			profileHref="/profile"
			themesHref="/themes"
			helpHref="/help"
			allAppsHref="/apps"
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

		<main class="main-content bg-background">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>

		<CommandBar
			bind:open={commandBarOpen}
			onClose={() => (commandBarOpen = false)}
			onSearch={handleCommandBarSearch}
			onSelect={handleCommandBarSelect}
			quickActions={commandBarQuickActions}
			placeholder="Schnellzugriff..."
			emptyText="Keine Ergebnisse"
			searchingText="Suche..."
		/>
	</div>

	<!-- Onboarding Modal -->
	{#if contextOnboarding.shouldShow}
		<MiniOnboardingModal store={contextOnboarding} appName="Context" appEmoji="📄" />
	{/if}

	<GuestWelcomeModal
		appId="context"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale={($locale || 'de') === 'de' ? 'de' : 'en'}
	/>
</AuthGate>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		position: relative;
		z-index: 0;
		padding-bottom: 100px;
	}

	.content-wrapper {
		max-width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding: 1rem;
		position: relative;
		z-index: 0;
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper {
			padding: 2rem;
		}
	}
</style>
