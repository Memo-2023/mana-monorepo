<script lang="ts">
	import ListView from '$lib/modules/broadcasts/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Broadcasts - Mana</title>
</svelte:head>

<RoutePage appId="broadcasts">
	<ListView />
</RoutePage>
