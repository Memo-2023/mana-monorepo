<script lang="ts">
	import ListView from '$lib/modules/body/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Body - Mana</title>
</svelte:head>

<RoutePage appId="body">
	<ListView />
</RoutePage>
