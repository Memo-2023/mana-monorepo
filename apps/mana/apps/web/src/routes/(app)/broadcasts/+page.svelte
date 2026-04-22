<script lang="ts">
	import ListView from '$lib/modules/broadcast/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Broadcasts - Mana</title>
</svelte:head>

<RoutePage appId="broadcasts">
	<ListView />
</RoutePage>
