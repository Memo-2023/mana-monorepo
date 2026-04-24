<script lang="ts">
	import { RoutePage } from '$lib/components/shell';
	import ListView from '$lib/modules/comic/ListView.svelte';
</script>

<svelte:head>
	<title>Comic · Mana</title>
</svelte:head>

<RoutePage appId="comic">
	<ListView />
</RoutePage>
