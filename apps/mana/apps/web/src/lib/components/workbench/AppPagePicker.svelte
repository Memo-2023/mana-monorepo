<!--
  AppPagePicker — Shows available apps to add as pages to the workbench.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { tick } from 'svelte';
	import { MagnifyingGlass } from '@mana/shared-icons';
	import PickerOverlay from '$lib/components/PickerOverlay.svelte';
	import { getAccessibleApps } from '$lib/app-registry';

	function appName(id: string, fallback: string): string {
		const key = `apps.${id}`;
		const translated = $_(key);
		return translated !== key ? translated : fallback;
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

	// Filter twice: tier-gate first (so guests + public users don't see
	// founder/alpha/beta apps at all), then drop apps that are already
	// open in the current scene. Sort alphabetically by the displayed
	// (i18n-resolved) name, then apply the search query.
	let availableApps = $derived(
		getAccessibleApps(userTier)
			.filter((app) => !activeAppIds.includes(app.id))
			.map((app) => ({ app, displayName: appName(app.id, app.name) }))
			.sort((a, b) => a.displayName.localeCompare(b.displayName, 'de'))
			.filter(({ displayName }) =>
				query.trim() === '' ? true : displayName.toLowerCase().includes(query.trim().toLowerCase())
			)
			.map(({ app }) => app)
	);

	// Auto-focus the search input when the picker opens.
	$effect(() => {
		tick().then(() => searchInput?.focus());
	});

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && availableApps.length > 0) {
			e.preventDefault();
			onSelect(availableApps[0].id);
		}
	}
</script>

<PickerOverlay
	title="App hinzufügen"
	items={availableApps}
	{onClose}
	width="300px"
	emptyLabel={query.trim() === '' ? 'Alle Apps sind bereits geöffnet' : 'Keine Treffer'}
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
	{#snippet item(app)}
		<button class="picker-option" onclick={() => onSelect(app.id)}>
			<div class="app-dot" style="background-color: {app.color}"></div>
			<span class="app-name">{appName(app.id, app.name)}</span>
		</button>
	{/snippet}
</PickerOverlay>

<style>
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

	:global(.picker .app-dot) {
		width: 10px;
		height: 10px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	:global(.picker .app-name) {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}
	:global(.dark .picker .app-name) {
		color: #f3f4f6;
	}
</style>
