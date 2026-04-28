<script lang="ts">
	import ListView from '$lib/modules/activity/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Aktivität - Mana</title>
</svelte:head>

<RoutePage appId="activity">
	<ListView />
</RoutePage>
