<script lang="ts">
	import ListView from '$lib/modules/sleep/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Sleep - Mana</title>
</svelte:head>

<RoutePage appId="sleep">
	<ListView />
</RoutePage>
