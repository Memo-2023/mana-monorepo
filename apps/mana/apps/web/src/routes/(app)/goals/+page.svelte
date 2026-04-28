<script lang="ts">
	import ListView from '$lib/modules/goals/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Ziele - Mana</title>
</svelte:head>

<RoutePage appId="goals">
	<ListView />
</RoutePage>
