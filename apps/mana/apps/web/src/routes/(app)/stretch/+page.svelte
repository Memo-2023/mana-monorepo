<script lang="ts">
	import { _ } from 'svelte-i18n';
	import ListView from '$lib/modules/stretch/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>{$_('stretch.route.title')} - Mana</title>
</svelte:head>

<RoutePage appId="stretch">
	<ListView />
</RoutePage>
