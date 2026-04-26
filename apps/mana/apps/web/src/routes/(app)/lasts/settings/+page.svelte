<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SettingsView from '$lib/modules/lasts/views/SettingsView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>{$_('lasts.settings.routeTitle')} - Mana</title>
</svelte:head>

<RoutePage appId="lasts" backHref="/lasts" title={$_('lasts.settings.routeTitle')}>
	<SettingsView />
</RoutePage>
