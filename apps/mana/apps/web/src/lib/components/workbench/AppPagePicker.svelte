<!--
  AppPagePicker — Shows available apps to add as pages to the workbench.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
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

	// Filter twice: tier-gate first (so guests + public users don't see
	// founder/alpha/beta apps at all), then drop apps that are already
	// open in the current scene.
	let availableApps = $derived(
		getAccessibleApps(userTier).filter((app) => !activeAppIds.includes(app.id))
	);
</script>

<PickerOverlay
	title="App hinzufügen"
	items={availableApps}
	{onClose}
	width="300px"
	emptyLabel="Alle Apps sind bereits geöffnet"
>
	{#snippet item(app)}
		<button class="picker-option" onclick={() => onSelect(app.id)}>
			<div class="app-dot" style="background-color: {app.color}"></div>
			<span class="app-name">{appName(app.id, app.name)}</span>
		</button>
	{/snippet}
</PickerOverlay>

<style>
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
