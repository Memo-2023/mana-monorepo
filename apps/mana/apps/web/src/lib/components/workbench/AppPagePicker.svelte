<!--
  AppPagePicker — Shows available apps to add as pages to the workbench,
  grouped by category (Companion, Leben, Arbeit, Kreativ, System).
  When a search query is active the categories collapse into a flat
  best-match list.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { tick } from 'svelte';
	import { MagnifyingGlass, CaretDown, CaretRight } from '@mana/shared-icons';
	import PickerOverlay from '$lib/components/PickerOverlay.svelte';
	import { getAccessibleApps } from '$lib/app-registry';
	import type { AppDescriptor } from '$lib/app-registry/types';
	import { APP_CATEGORIES, getAppCategory, type AppCategory } from '$lib/app-registry/categories';
	import appsDeRaw from '$lib/i18n/locales/apps/de.json';
	import appsEnRaw from '$lib/i18n/locales/apps/en.json';

	const appsDe = appsDeRaw as Record<string, string>;
	const appsEn = appsEnRaw as Record<string, string>;

	function appName(id: string, fallback: string): string {
		const key = `apps.${id}`;
		const translated = $_(key);
		return translated !== key ? translated : fallback;
	}

	// Match against DE + EN names, fallback, and id together so English
	// aliases stay searchable while the UI is in German ("cal" → Kalender).
	function searchHaystack(id: string, fallback: string, displayName: string): string {
		return [displayName, fallback, appsDe[id], appsEn[id], id.replace(/-/g, ' ')]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
	}

	interface Props {
		onSelect: (appId: string) => void;
		onClose: () => void;
		activeAppIds?: string[];
		/** User access tier from authStore.user?.tier — `undefined` falls
		 *  through to 'guest' inside getAccessibleApps. */
		userTier?: string | null;
	}

	let { onSelect, onClose, activeAppIds = [], userTier = null }: Props = $props();

	let query = $state('');
	let searchInput = $state<HTMLInputElement | null>(null);

	// Collapsed state per category — persist across openings in-session.
	let collapsed = $state<Record<AppCategory, boolean>>({
		ai: false,
		companion: false,
		life: false,
		work: false,
		creative: false,
		system: true, // System is collapsed by default — noisy and rarely toggled
	});

	// Tier-gate first, then drop open apps, then attach display name + search haystack.
	let available = $derived(
		getAccessibleApps(userTier)
			.filter((app) => !activeAppIds.includes(app.id))
			.map((app) => {
				const displayName = appName(app.id, app.name);
				return { app, displayName, haystack: searchHaystack(app.id, app.name, displayName) };
			})
			.sort((a, b) => a.displayName.localeCompare(b.displayName, 'de'))
	);

	// Search mode: filter flat across all apps when query is non-empty.
	let searchMode = $derived(query.trim().length > 0);

	let searchResults = $derived(
		searchMode
			? available.filter(({ haystack }) => haystack.includes(query.trim().toLowerCase()))
			: []
	);

	// Grouped mode: partition into the 5 categories, preserving order.
	let grouped = $derived(
		searchMode
			? []
			: APP_CATEGORIES.map((cat) => ({
					category: cat,
					apps: available.filter(({ app }) => getAppCategory(app.id) === cat.id),
				})).filter((g) => g.apps.length > 0)
	);

	$effect(() => {
		tick().then(() => searchInput?.focus());
	});

	function toggleCategory(id: AppCategory) {
		collapsed[id] = !collapsed[id];
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && searchResults.length > 0) {
			e.preventDefault();
			onSelect(searchResults[0].app.id);
		}
	}

	// PickerOverlay expects a flat items array; we bypass that and render
	// groups ourselves in a custom snippet via the `item` callback — but
	// we feed it an empty items array and use the `footer` slot for our
	// entire custom layout. Cleaner: render our own layout inside a
	// single-entry item snippet.
	type Row =
		| { kind: 'header'; category: (typeof APP_CATEGORIES)[number]; count: number }
		| { kind: 'app'; app: AppDescriptor; displayName: string; category: AppCategory };

	let rows = $derived<Row[]>(
		searchMode
			? searchResults.map(({ app, displayName }) => ({
					kind: 'app' as const,
					app,
					displayName,
					category: getAppCategory(app.id),
				}))
			: grouped.flatMap((g) => {
					const header: Row = {
						kind: 'header' as const,
						category: g.category,
						count: g.apps.length,
					};
					if (collapsed[g.category.id]) return [header];
					const apps: Row[] = g.apps.map(({ app, displayName }) => ({
						kind: 'app' as const,
						app,
						displayName,
						category: g.category.id,
					}));
					return [header, ...apps];
				})
	);
</script>

<div class="app-picker-wrapper">
	<PickerOverlay
		title="App hinzufügen"
		items={rows}
		{onClose}
		width="320px"
		emptyLabel={searchMode ? 'Keine Treffer' : 'Alle Apps sind bereits geöffnet'}
	>
		{#snippet subheader()}
			<div class="search-wrap">
				<MagnifyingGlass size={14} />
				<input
					bind:this={searchInput}
					bind:value={query}
					type="text"
					placeholder="Suchen…"
					class="search-input"
					onkeydown={handleSearchKeydown}
				/>
			</div>
		{/snippet}
		{#snippet item(row)}
			{#if row.kind === 'header'}
				{@const CatIcon = row.category.icon}
				{@const isCollapsed = collapsed[row.category.id]}
				<button class="cat-header" onclick={() => toggleCategory(row.category.id)}>
					<span class="cat-chevron">
						{#if isCollapsed}
							<CaretRight size={12} weight="bold" />
						{:else}
							<CaretDown size={12} weight="bold" />
						{/if}
					</span>
					<span class="cat-icon-wrap">
						<CatIcon size={14} />
					</span>
					<span class="cat-label">{row.category.label}</span>
					<span class="cat-count">{row.count}</span>
				</button>
			{:else}
				{@const Icon = row.app.icon}
				<button class="app-option" onclick={() => onSelect(row.app.id)}>
					<span class="app-icon-wrap">
						{#if Icon}<Icon size={16} />{/if}
					</span>
					<span class="app-name">{row.displayName}</span>
				</button>
			{/if}
		{/snippet}
	</PickerOverlay>
</div>

<style>
	.app-picker-wrapper {
		display: contents;
	}
	/* Hide auto-rendered dividers from PickerOverlay — we use typography
	   and collapse chevrons for visual grouping instead. */
	.app-picker-wrapper :global(.picker .divider) {
		display: none;
	}

	.search-wrap {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted) / 0.6);
		color: hsl(var(--color-muted-foreground));
		transition: background 0.15s;
	}
	.search-wrap:focus-within {
		background: hsl(var(--color-muted));
	}
	.search-input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	/* Category header row */
	:global(.picker .cat-header) {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.625rem 0.5rem 0.375rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 0.375rem;
		text-align: left;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: color 0.15s;
	}
	:global(.picker .cat-header:hover) {
		color: hsl(var(--color-foreground));
	}
	:global(.picker .cat-chevron) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		flex-shrink: 0;
	}
	:global(.picker .cat-icon-wrap) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		flex-shrink: 0;
	}
	:global(.picker .cat-label) {
		flex: 1;
	}
	:global(.picker .cat-count) {
		font-size: 0.625rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-muted) / 0.4);
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		text-transform: none;
		letter-spacing: 0;
	}

	/* App row */
	:global(.picker .app-option) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.5rem 0.5rem 0.5rem 1.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: background 0.15s;
		text-align: left;
	}
	:global(.picker .app-option:hover) {
		background: hsl(var(--color-surface-hover));
	}
	:global(.picker .app-icon-wrap) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		color: hsl(var(--color-muted-foreground));
	}
	:global(.picker .app-option:hover .app-icon-wrap) {
		color: hsl(var(--color-foreground));
	}
	:global(.picker .app-name) {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
</style>
