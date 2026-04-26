<script lang="ts">
	import { _ } from 'svelte-i18n';
	import InboxView from '$lib/modules/lasts/views/InboxView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>{$_('lasts.inbox.routeTitle')} - Mana</title>
</svelte:head>

<RoutePage appId="lasts" backHref="/lasts" title={$_('lasts.inbox.routeTitle')}>
	<InboxView />
</RoutePage>
