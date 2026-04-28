<script lang="ts">
	import ListView from '$lib/modules/rituals/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Rituale - Mana</title>
</svelte:head>

<RoutePage appId="rituals">
	<ListView />
</RoutePage>
