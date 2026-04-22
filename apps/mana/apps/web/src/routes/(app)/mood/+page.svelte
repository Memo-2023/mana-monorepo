<script lang="ts">
	import ListView from '$lib/modules/mood/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Mood - Mana</title>
</svelte:head>

<RoutePage appId="mood">
	<ListView />
</RoutePage>
