<script lang="ts">
	import ListView from '$lib/modules/stretch/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Stretch - Mana</title>
</svelte:head>

<RoutePage appId="stretch">
	<ListView />
</RoutePage>
