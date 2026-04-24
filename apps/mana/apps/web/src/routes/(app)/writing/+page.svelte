<script lang="ts">
	import ListView from '$lib/modules/writing/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Writing - Mana</title>
</svelte:head>

<RoutePage appId="writing">
	<ListView />
</RoutePage>
