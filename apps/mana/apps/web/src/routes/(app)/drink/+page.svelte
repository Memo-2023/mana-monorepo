<script lang="ts">
	import ListView from '$lib/modules/drink/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Drink - Mana</title>
</svelte:head>

<RoutePage appId="drink">
	<ListView />
</RoutePage>
